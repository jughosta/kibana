/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ReactNode, ReactElement } from 'react';
import React from 'react';
import ReactDOM from 'react-dom/server';
import { escape, transform, size, cloneDeep, get, defaults } from 'lodash';
import { EMPTY_LABEL, MISSING_TOKEN, NULL_LABEL } from '@kbn/field-formats-common';
import { createCustomFieldFormat } from './converters/custom';
import { checkForMissingValueHtml } from './utils';
import type {
  FieldFormatsGetConfigFn,
  FieldFormatsContentType,
  FieldFormatInstanceType,
  FieldFormatConvert,
  FieldFormatConvertFunction,
  HtmlContextTypeOptions,
  TextContextTypeOptions,
  FieldFormatMetaParams,
  FieldFormatParams,
} from './types';
import { htmlContentTypeSetup, textContentTypeSetup, TEXT_CONTEXT_TYPE } from './content_types';
import { getHighlightReact } from './utils/highlight';
import type {
  HtmlContextTypeConvert,
  ReactContextTypeConvert,
  TextContextTypeConvert,
} from './types';

const DEFAULT_CONTEXT_TYPE = TEXT_CONTEXT_TYPE;

export abstract class FieldFormat {
  /**
   * @property {string} - Field Format Id
   * @static
   * @public
   */
  static id: string;

  /**
   * Hidden field formats can only be accessed directly by id,
   * They won't appear in field format editor UI,
   * But they can be accessed and used from code internally.
   *
   * @property {boolean} -  Is this a hidden field format
   * @static
   * @public
   */
  static hidden: boolean;

  /**
   * @property {string} -  Field Format Title
   * @static
   * @public
   */
  static title: string;

  /**
   * @property {string} - Field Format Type
   * @internal
   */
  static fieldType: string | string[];

  /**
   * @property {FieldFormatConvert}
   * @internal
   * have to remove the private because of
   * https://github.com/Microsoft/TypeScript/issues/17293
   */
  convertObject: FieldFormatConvert | undefined;

  /**
   * @property {htmlConvert}
   * @protected
   * have to remove the protected because of
   * https://github.com/Microsoft/TypeScript/issues/17293
   * @deprecated Use reactConvert instead
   */
  htmlConvert: HtmlContextTypeConvert | undefined;

  /**
   * React-based converter. Prefer this over htmlConvert for new formatters.
   * FieldFormatValue renders the result natively without dangerouslySetInnerHTML.
   * The default implementation delegates to textConvert, so plain-text formatters
   * get correct React rendering for free without overriding this method.
   * @property {reactConvert}
   * @protected
   * have to remove the protected because of
   * https://github.com/Microsoft/TypeScript/issues/17293
   */
  reactConvert: ReactContextTypeConvert = (val, options) => {
    if (this.textConvert) {
      const missing = this.checkForMissingValueReact(val);
      if (missing) return missing;
    }
    const formatted = this.textConvert
      ? this.textConvert(val, options)
      : // Some formatters (e.g. AggsTermsFieldFormat, AggsMultiTermsFieldFormat) override
        // convert() directly instead of textConvert, to intercept special bucket values such as
        // __other__ and __missing__ and replace them with user-configured labels before delegating
        // to an underlying field format. Calling this.convert('text') respects that logic.
        // Note: checkForMissingValueReact is intentionally skipped here so those formatters can
        // apply their own missing-bucket label instead of the generic null placeholder.
        this.convert(val, 'text', options);
    const highlights = options?.hit?.highlight?.[options?.field?.name!];
    return highlights ? getHighlightReact(formatted, highlights) : formatted;
  };

  /**
   * @property {textConvert}
   * @protected
   * have to remove the protected because of
   * https://github.com/Microsoft/TypeScript/issues/17293
   */
  textConvert: TextContextTypeConvert | undefined;

  /**
   * @property {Function} - ref to child class
   * @internal
   */
  public type = this.constructor as typeof FieldFormat;
  public allowsNumericalAggregations?: boolean;

  protected readonly _params: FieldFormatParams & FieldFormatMetaParams;
  protected getConfig: FieldFormatsGetConfigFn | undefined;

  constructor(
    _params: FieldFormatParams & FieldFormatMetaParams = {},
    getConfig?: FieldFormatsGetConfigFn
  ) {
    this._params = _params;

    if (getConfig) {
      this.getConfig = getConfig;
    }
  }

  /**
   * Convert a raw value to a formatted string
   * @param  {unknown} value
   * @param  {string} [contentType=text] - optional content type, the only two contentTypes
   *                                currently supported are "html" and "text", which helps
   *                                formatters adjust to different contexts
   * @return {string} - the formatted string, which is assumed to be html, safe for
   *                    injecting into the DOM or a DOM attribute
   * @public
   */
  convert(
    value: unknown,
    contentType: FieldFormatsContentType = DEFAULT_CONTEXT_TYPE,
    options?: HtmlContextTypeOptions | TextContextTypeOptions
  ): string {
    return this.getConverterFor(contentType).call(this, value, options);
  }

  /**
   * Get a convert function that is bound to a specific contentType
   * @param  {string} [contentType=text]
   * @return {function} - a bound converter function
   * @public
   */
  getConverterFor(
    contentType: FieldFormatsContentType = DEFAULT_CONTEXT_TYPE
  ): FieldFormatConvertFunction {
    if (!this.convertObject) {
      this.convertObject = this.setupContentType();
    }

    return this.convertObject[contentType] ?? this.convertObject.text;
  }

  /**
   * Get parameter defaults
   * @return {object} - parameter defaults
   * @public
   */
  getParamDefaults(): FieldFormatParams {
    return {};
  }

  /**
   * Get the value of a param. This value may be a default value.
   *
   * @param  {string} name - the param name to fetch
   * @return {any} TODO: https://github.com/elastic/kibana/issues/108158
   * @public
   */
  param(name: string): any {
    const val = get(this._params, name);

    if (val || val === false || val === 0) {
      // truthy, false, or 0 are fine
      // '', NaN, null, undefined, etc are not
      return val;
    }

    return get(this.getParamDefaults(), name);
  }

  /**
   * Get all of the params in a single object
   * @return {object}
   * @public
   */
  params(): FieldFormatParams & FieldFormatMetaParams {
    return cloneDeep(defaults({}, this._params, this.getParamDefaults()));
  }

  /**
   * Serialize this format to a simple POJO, with only the params
   * that are not default
   *
   * @return {object}
   * @public
   */
  toJSON() {
    const id = this.type.id;
    const defaultsParams = this.getParamDefaults() || {};

    const params = transform(
      this._params,
      (uniqParams: FieldFormatParams & FieldFormatMetaParams, val, param: string) => {
        if (param === 'parsedUrl') return;
        if (param && val !== get(defaultsParams, param)) {
          uniqParams[param] = val;
        }
      },
      {}
    );

    return {
      id,
      params: size(params) ? params : undefined,
    };
  }

  static from(convertFn: FieldFormatConvertFunction): FieldFormatInstanceType {
    return createCustomFieldFormat(convertFn);
  }

  setupContentType(): FieldFormatConvert {
    // Bridge: if no explicit htmlConvert, derive the HTML converter from reactConvert via
    // renderToStaticMarkup so legacy consumers keep working unchanged.
    let htmlConverter = this.htmlConvert;
    if (!htmlConverter) {
      const reactConvert = this.reactConvert.bind(this);
      htmlConverter = (value, options) => {
        const missing = checkForMissingValueHtml(value);
        if (missing) return missing;
        const node = reactConvert(value, options);
        if (node == null) return '';
        if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
          // Plain scalars must be HTML-escaped since the result is injected as raw HTML
          return escape(String(node));
        }
        return ReactDOM.renderToStaticMarkup(node as ReactElement);
      };
    }

    return {
      text: textContentTypeSetup(this, this.textConvert),
      html: htmlContentTypeSetup(this, htmlConverter),
    };
  }

  static isInstanceOfFieldFormat(fieldFormat: unknown): fieldFormat is FieldFormat {
    return Boolean(fieldFormat && typeof fieldFormat === 'object' && 'convert' in fieldFormat);
  }

  protected checkForMissingValueText(val: unknown): string | void {
    if (val === '') {
      return EMPTY_LABEL;
    }
    if (val == null || val === MISSING_TOKEN) {
      return NULL_LABEL;
    }
  }

  protected checkForMissingValueReact(val: unknown): ReactNode | void {
    if (val === '') {
      return React.createElement('span', { className: 'ffString__emptyValue' }, EMPTY_LABEL);
    }
    if (val == null || val === MISSING_TOKEN) {
      return React.createElement('span', { className: 'ffString__emptyValue' }, NULL_LABEL);
    }
  }
}
