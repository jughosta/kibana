/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { BytesFormat } from './bytes';
import { FORMATS_UI_SETTINGS } from '../constants/ui_settings';
import type { FieldFormatsGetConfigFn } from '../types';
import { HTML_CONTEXT_TYPE } from '../content_types';
import { expectReactElementWithNull } from '../test_utils';

describe('BytesFormat', () => {
  const config: { [key: string]: string } = {
    [FORMATS_UI_SETTINGS.FORMAT_BYTES_DEFAULT_PATTERN]: '0,0.[000]b',
  };

  const getConfig: FieldFormatsGetConfigFn = (key: string) => config[key];

  test('default pattern', () => {
    const formatter = new BytesFormat({}, getConfig);

    expect(formatter.convert(5150000)).toBe('4.911MB');
    expect(formatter.convert(5150000, HTML_CONTEXT_TYPE)).toBe('4.911MB');
    expect(formatter.reactConvert(5150000)).toBe('4.911MB');
  });

  test('custom pattern', () => {
    const formatter = new BytesFormat({ pattern: '0,0b' }, getConfig);

    expect(formatter.convert('5150000')).toBe('5MB');
    expect(formatter.convert('5150000', HTML_CONTEXT_TYPE)).toBe('5MB');
    expect(formatter.reactConvert('5150000')).toBe('5MB');
  });

  test('missing value', () => {
    const formatter = new BytesFormat({}, getConfig);

    expect(formatter.convert(null)).toBe('(null)');
    expect(formatter.convert(undefined)).toBe('(null)');
    expect(formatter.convert(null, HTML_CONTEXT_TYPE)).toBe(
      '<span class="ffString__emptyValue">(null)</span>'
    );
    expect(formatter.convert(undefined, HTML_CONTEXT_TYPE)).toBe(
      '<span class="ffString__emptyValue">(null)</span>'
    );
    expectReactElementWithNull(formatter.reactConvert(null));
    expectReactElementWithNull(formatter.reactConvert(undefined));
  });

  test('wraps a multi-value array with bracket notation', () => {
    const formatter = new BytesFormat({}, getConfig);

    expect(formatter.convert([1024, 2048], 'text')).toBe('["1KB","2KB"]');
    expect(formatter.convert([1024, 2048], HTML_CONTEXT_TYPE)).toBe(
      '<span class="ffArray__highlight">[</span>1KB<span class="ffArray__highlight">,</span> 2KB<span class="ffArray__highlight">]</span>'
    );
    expect(formatter.reactConvert([1024, 2048])).toMatchInlineSnapshot(`
      <React.Fragment>
        <span
          className="ffArray__highlight"
        >
          [
        </span>
        1KB
        <span
          className="ffArray__highlight"
        >
          ,
        </span>
         
        2KB
        <span
          className="ffArray__highlight"
        >
          ]
        </span>
      </React.Fragment>
    `);
  });

  test('returns the single element without brackets for a one-element array', () => {
    const formatter = new BytesFormat({}, getConfig);

    expect(formatter.convert([1024], 'text')).toBe('["1KB"]');
    expect(formatter.convert([1024], HTML_CONTEXT_TYPE)).toBe('1KB');
    expect(formatter.reactConvert([1024])).toBe('1KB');
  });
});
