/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { NumberFormat } from './number';
import { FORMATS_UI_SETTINGS } from '../constants/ui_settings';
import { NULL_LABEL } from '@kbn/field-formats-common';

describe('NumberFormat', () => {
  const config: { [key: string]: string } = {
    [FORMATS_UI_SETTINGS.FORMAT_NUMBER_DEFAULT_PATTERN]: '0,0.[000]',
  };

  const getConfig = (key: string) => config[key];

  test('default pattern', () => {
    const formatter = new NumberFormat({}, getConfig);

    expect(formatter.convert(12.345678)).toBe('12.346');
  });

  test('custom pattern', () => {
    const formatter = new NumberFormat({ pattern: '0,0' }, getConfig);

    expect(formatter.convert('12.345678')).toBe('12');
  });

  test('object input', () => {
    const formatter = new NumberFormat({}, getConfig);
    expect(
      formatter.convert({ min: 150, max: 1000, sum: 5000, value_count: 10 })
    ).toMatchInlineSnapshot(`"{\\"min\\":150,\\"max\\":1000,\\"sum\\":5000,\\"value_count\\":10}"`);
    expect(formatter.convert({ min: 150, max: 1000, sum: 5000, value_count: 10 }, 'html'))
      .toMatchInlineSnapshot(`
      "{
        &quot;min&quot;: 150,
        &quot;max&quot;: 1000,
        &quot;sum&quot;: 5000,
        &quot;value_count&quot;: 10
      }"
    `);
  });

  test('object input stringified', () => {
    const formatter = new NumberFormat({}, getConfig);
    expect(
      formatter.convert('{"min":-302.5,"max":702.3,"sum":200.0,"value_count":25}')
    ).toMatchInlineSnapshot(
      `"{\\"min\\":-302.5,\\"max\\":702.3,\\"sum\\":200.0,\\"value_count\\":25}"`
    );
    expect(
      formatter.convert('{"min":-302.5,"max":702.3,"sum":200.0,"value_count":25}', 'html')
    ).toMatchInlineSnapshot(
      `"{&quot;min&quot;:-302.5,&quot;max&quot;:702.3,&quot;sum&quot;:200.0,&quot;value_count&quot;:25}"`
    );
  });

  test('null input', () => {
    const formatter = new NumberFormat({}, getConfig);
    expect(formatter.convert(null)).toBe(NULL_LABEL);
    expect(formatter.convert(null, 'html')).toBe(
      `<span class="ffString__emptyValue">${NULL_LABEL}</span>`
    );
  });

  test('escapes HTML characters in html context', () => {
    const formatter = new NumberFormat({}, getConfig);
    const objWithHtml = { value: '<script>alert("test")</script>' };
    expect(formatter.convert(objWithHtml, 'html')).toBe(
      '{\n  &quot;value&quot;: &quot;&lt;script&gt;alert(\\&quot;test\\&quot;)&lt;/script&gt;&quot;\n}'
    );
  });
});

describe('NumberFormat — reactConvert', () => {
  const getConfig = (key: string) =>
    ({ [FORMATS_UI_SETTINGS.FORMAT_NUMBER_DEFAULT_PATTERN]: '0,0.[000]' }[key]);

  test('formats a number value', () => {
    const formatter = new NumberFormat({}, getConfig);
    expect(formatter.reactConvert(12.345678)).toMatchInlineSnapshot(`"12.346"`);
  });

  test('formats a string that parses as a number', () => {
    const formatter = new NumberFormat({ pattern: '0,0' }, getConfig);
    expect(formatter.reactConvert('12.345678')).toMatchInlineSnapshot(`"12"`);
  });

  test('returns null placeholder for null', () => {
    const formatter = new NumberFormat({}, getConfig);
    expect(formatter.reactConvert(null)).toMatchInlineSnapshot(`
      <span
        className="ffString__emptyValue"
      >
        (null)
      </span>
    `);
  });

  test('pretty-prints object input as JSON', () => {
    const formatter = new NumberFormat({}, getConfig);
    expect(formatter.reactConvert({ min: 150, max: 1000 })).toMatchInlineSnapshot(`
      "{
        \\"min\\": 150,
        \\"max\\": 1000
      }"
    `);
  });

  test('wraps a multi-value array with bracket notation', () => {
    const formatter = new NumberFormat({ pattern: '0,0' }, getConfig);
    expect(formatter.reactConvert([1000, 2000])).toMatchInlineSnapshot(`
      <React.Fragment>
        <span
          className="ffArray__highlight"
        >
          [
        </span>
        1,000
        <span
          className="ffArray__highlight"
        >
          ,
        </span>
         
        2,000
        <span
          className="ffArray__highlight"
        >
          ]
        </span>
      </React.Fragment>
    `);
  });

  test('returns the single element without brackets for a one-element array', () => {
    const formatter = new NumberFormat({ pattern: '0,0' }, getConfig);
    expect(formatter.reactConvert([1000])).toMatchInlineSnapshot(`"1,000"`);
  });
});
