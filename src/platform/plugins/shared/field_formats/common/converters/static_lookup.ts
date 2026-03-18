/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { escape } from 'lodash';
import { KBN_FIELD_TYPES } from '@kbn/field-types';
import { FieldFormat } from '../field_format';
import type { TextContextTypeConvert, HtmlContextTypeConvert } from '../types';
import { FIELD_FORMAT_IDS } from '../types';
import { getHighlightHtml, checkForMissingValueHtml } from '../utils';

function convertLookupEntriesToMap(
  lookupEntries: Array<{ key: string; value: unknown }>
): Record<string, unknown> {
  return lookupEntries.reduce(
    (lookupMap: Record<string, unknown>, lookupEntry: { key: string; value: unknown }) => {
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

  textConvert: TextContextTypeConvert = (val: string) => {
    const lookupEntries = this.param('lookupEntries');
    const unknownKeyValue = this.param('unknownKeyValue');

    const lookupMap = convertLookupEntriesToMap(lookupEntries);
    return lookupMap[val] || unknownKeyValue || val;
  };

  htmlConvert: HtmlContextTypeConvert = (value, options = {}) => {
    // Apply the same lookup logic as textConvert
    const textResult = this.textConvert(value);

    // Only apply missing value handling if the final result is null/empty
    // and it's the same as the original value (meaning no custom mapping was applied)
    if (textResult === value) {
      const missingHtml = checkForMissingValueHtml(textResult);
      if (missingHtml) {
        return missingHtml;
      }
    }

    // Escape the result and handle highlights
    const { field, hit } = options;
    const formatted = escape(String(textResult));

    return !field || !hit || !hit.highlight || !hit.highlight[field.name]
      ? formatted
      : getHighlightHtml(formatted, hit.highlight[field.name]);
  };
}
