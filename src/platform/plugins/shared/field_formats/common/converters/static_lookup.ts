/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import escape from 'lodash/escape';
import { KBN_FIELD_TYPES } from '@kbn/field-types';
import { FieldFormat } from '../field_format';
import type { TextContextTypeConvert, HtmlContextTypeConvert } from '../types';
import { FIELD_FORMAT_IDS } from '../types';
import { getHighlightHtml, checkForMissingValueHtml } from '../utils';

function convertLookupEntriesToMap(
  lookupEntries: Array<{ key?: string | null; value: unknown }>
): Record<string, unknown> {
  return lookupEntries.reduce(
    (lookupMap: Record<string, unknown>, lookupEntry: { key?: string | null; value: unknown }) => {
      // Treat undefined/null keys as empty string keys only when a value is provided
      const key = lookupEntry.key ?? (lookupEntry.value != null ? '' : undefined);
      if (key != null) {
        lookupMap[key] = lookupEntry.value;
      }

      /**
       * Do some key translations because Elasticsearch returns
       * boolean-type aggregation results as 0 and 1
       */
      if (key === 'true') {
        lookupMap[1] = lookupEntry.value;
      }

      if (key === 'false') {
        lookupMap[0] = lookupEntry.value;
      }

      return lookupMap;
    },
    {} as Record<string, unknown>
  );
}

/** @public */
export class StaticLookupFormat extends FieldFormat {
  static id = FIELD_FORMAT_IDS.STATIC_LOOKUP;
  static title = i18n.translate('fieldFormats.static_lookup.title', {
    defaultMessage: 'Static lookup',
  });
  static fieldType = [
    KBN_FIELD_TYPES.STRING,
    KBN_FIELD_TYPES.NUMBER,
    KBN_FIELD_TYPES.IP,
    KBN_FIELD_TYPES.BOOLEAN,
  ];

  getParamDefaults() {
    return {
      lookupEntries: [{}],
      unknownKeyValue: null,
    };
  }

  private lookup(val: unknown): { result: unknown; wasMapped: boolean } {
    const lookupEntries = this.param('lookupEntries');
    const unknownKeyValue = this.param('unknownKeyValue');
    const lookupMap = convertLookupEntriesToMap(lookupEntries);

    // Guard against null/undefined before checking key, and normalize to string key
    if (val != null) {
      const key = String(val);
      // Use Object.hasOwn to check key existence (handles falsy mapped values like '' and avoids prototype chain)
      if (Object.hasOwn(lookupMap, key)) {
        return { result: lookupMap[key], wasMapped: true };
      }
    }

    // Use nullish coalescing to allow falsy unknownKeyValue (e.g., '')
    if (unknownKeyValue != null) {
      return { result: unknownKeyValue, wasMapped: true };
    }

    return { result: val, wasMapped: false };
  }

  textConvert: TextContextTypeConvert = (val: string) => {
    const { result, wasMapped } = this.lookup(val);

    // Only apply missing value handling if no custom mapping was applied
    if (!wasMapped) {
      const missingText = this.checkForMissingValueText(result);
      if (missingText) {
        return missingText;
      }
    }

    return String(result ?? '');
  };

  htmlConvert: HtmlContextTypeConvert = (value, options = {}) => {
    const { result, wasMapped } = this.lookup(value);

    // Only apply missing value handling if no custom mapping was applied
    if (!wasMapped) {
      const missingHtml = checkForMissingValueHtml(result);
      if (missingHtml) {
        return missingHtml;
      }
    }

    // Escape the result and handle highlights
    const { field, hit } = options;
    const formatted = escape(String(result ?? ''));

    return !field || !hit || !hit.highlight || !hit.highlight[field.name]
      ? formatted
      : getHighlightHtml(formatted, hit.highlight[field.name]);
  };
}
