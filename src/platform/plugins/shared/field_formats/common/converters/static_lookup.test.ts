/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { StaticLookupFormat } from './static_lookup';

describe('StaticLookupFormat', () => {
  let formatter: StaticLookupFormat;

  beforeEach(() => {
    formatter = new StaticLookupFormat({
      lookupEntries: [
        { key: '', value: 'Empty String Mapped' },
        { key: 'test', value: 'Test Value' },
        { key: 'html', value: '<script>alert("xss")</script>' },
      ],
      unknownKeyValue: 'Custom Unknown',
    });
  });

  describe('textConvert', () => {
    test('maps empty string to configured value', () => {
      expect(formatter.convert('', 'text')).toBe('Empty String Mapped');
    });

    test('maps null to unknownKeyValue', () => {
      expect(formatter.convert(null, 'text')).toBe('Custom Unknown');
    });

    test('maps undefined to unknownKeyValue', () => {
      expect(formatter.convert(undefined, 'text')).toBe('Custom Unknown');
    });

    test('maps known key to configured value', () => {
      expect(formatter.convert('test', 'text')).toBe('Test Value');
    });

    test('maps unknown key to unknownKeyValue', () => {
      expect(formatter.convert('unknown', 'text')).toBe('Custom Unknown');
    });

    test('falls back to original value when no unknownKeyValue is set', () => {
      const formatterWithoutUnknown = new StaticLookupFormat({
        lookupEntries: [{ key: 'test', value: 'Test Value' }],
        unknownKeyValue: null,
      });
      expect(formatterWithoutUnknown.convert('unknown', 'text')).toBe('unknown');
    });
  });

  describe('htmlConvert', () => {
    test('maps empty string to configured value and escapes HTML', () => {
      expect(formatter.convert('', 'html')).toBe('Empty String Mapped');
    });

    test('maps null to unknownKeyValue and escapes HTML', () => {
      expect(formatter.convert(null, 'html')).toBe('Custom Unknown');
    });

    test('maps undefined to unknownKeyValue and escapes HTML', () => {
      expect(formatter.convert(undefined, 'html')).toBe('Custom Unknown');
    });

    test('maps known key to configured value and escapes HTML', () => {
      expect(formatter.convert('test', 'html')).toBe('Test Value');
    });

    test('maps unknown key to unknownKeyValue and escapes HTML', () => {
      expect(formatter.convert('unknown', 'html')).toBe('Custom Unknown');
    });

    test('escapes HTML in mapped values', () => {
      expect(formatter.convert('html', 'html')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    test('preserves highlight functionality', () => {
      const options = {
        field: { name: 'test_field' },
        hit: {
          highlight: {
            test_field: ['@kibana-highlighted-field@Test@/kibana-highlighted-field@ Value'],
          },
        },
      };
      // The highlight should replace the formatted text with the highlighted version
      expect(formatter.convert('test', 'html', options)).toBe(
        '<mark class="ffSearch__highlight">Test</mark> Value'
      );
    });

    test('falls back to missing value handling when no custom mapping exists', () => {
      const formatterWithoutCustomMapping = new StaticLookupFormat({
        lookupEntries: [{ key: 'test', value: 'Test Value' }],
        unknownKeyValue: null, // No custom unknown value
      });

      // Empty string should show (blank) since no custom mapping exists
      expect(formatterWithoutCustomMapping.convert('', 'html')).toBe(
        '<span class="ffString__emptyValue">(blank)</span>'
      );

      // Null should show (null) since no custom mapping exists
      expect(formatterWithoutCustomMapping.convert(null, 'html')).toBe(
        '<span class="ffString__emptyValue">(null)</span>'
      );

      // Undefined should show (null) since no custom mapping exists
      expect(formatterWithoutCustomMapping.convert(undefined, 'html')).toBe(
        '<span class="ffString__emptyValue">(null)</span>'
      );

      // Unknown value should fall back to original value since unknownKeyValue is null
      expect(formatterWithoutCustomMapping.convert('unknown', 'html')).toBe('unknown');
    });
  });

  describe('boolean key translations', () => {
    beforeEach(() => {
      formatter = new StaticLookupFormat({
        lookupEntries: [
          { key: 'true', value: 'Yes' },
          { key: 'false', value: 'No' },
        ],
        unknownKeyValue: 'Unknown',
      });
    });

    test('maps boolean true (1) to "true" key value', () => {
      expect(formatter.convert(1, 'text')).toBe('Yes');
      expect(formatter.convert(1, 'html')).toBe('Yes');
    });

    test('maps boolean false (0) to "false" key value', () => {
      expect(formatter.convert(0, 'text')).toBe('No');
      expect(formatter.convert(0, 'html')).toBe('No');
    });

    test('maps string "true" to configured value', () => {
      expect(formatter.convert('true', 'text')).toBe('Yes');
      expect(formatter.convert('true', 'html')).toBe('Yes');
    });

    test('maps string "false" to configured value', () => {
      expect(formatter.convert('false', 'text')).toBe('No');
      expect(formatter.convert('false', 'html')).toBe('No');
    });
  });

  describe('edge cases', () => {
    test('handles empty lookupEntries array', () => {
      const emptyFormatter = new StaticLookupFormat({
        lookupEntries: [],
        unknownKeyValue: 'Default',
      });
      expect(emptyFormatter.convert('anything', 'text')).toBe('Default');
      expect(emptyFormatter.convert('anything', 'html')).toBe('Default');
    });

    test('handles lookupEntries with empty objects', () => {
      const formatterWithEmptyEntries = new StaticLookupFormat({
        lookupEntries: [{}],
        unknownKeyValue: 'Default',
      });
      expect(formatterWithEmptyEntries.convert('test', 'text')).toBe('Default');
      expect(formatterWithEmptyEntries.convert('test', 'html')).toBe('Default');
    });
  });
});
