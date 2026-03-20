/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { SourceFormat } from './source';
import type { HtmlContextTypeConvert } from '../types';
import { HTML_CONTEXT_TYPE, TEXT_CONTEXT_TYPE } from '../content_types';

describe('Source Format', () => {
  let convertHtml: Function;

  beforeEach(() => {
    const source = new SourceFormat({}, jest.fn());

    convertHtml = source.getConverterFor(HTML_CONTEXT_TYPE) as HtmlContextTypeConvert;
  });

  test('should render stringified object', () => {
    const hit = {
      foo: 'bar',
      number: 42,
      hello: '<h1>World</h1>',
      also: 'with "quotes" or \'single quotes\'',
    };

    expect(convertHtml(hit, { field: 'field', hit })).toMatchInlineSnapshot(
      `"{&quot;foo&quot;:&quot;bar&quot;,&quot;number&quot;:42,&quot;hello&quot;:&quot;&lt;h1&gt;World&lt;/h1&gt;&quot;,&quot;also&quot;:&quot;with \\\\&quot;quotes\\\\&quot; or &#39;single quotes&#39;&quot;}"`
    );
  });

  test('returns a plain JSON string for an object', () => {
    const source = new SourceFormat({}, jest.fn());

    expect(source.convert({ foo: 'bar', n: 42 })).toBe('{"foo":"bar","n":42}');
    expect(source.convert({ foo: 'bar', n: 42 }, HTML_CONTEXT_TYPE)).toBe(
      '{&quot;foo&quot;:&quot;bar&quot;,&quot;n&quot;:42}'
    );
    expect(source.reactConvert({ foo: 'bar', n: 42 })).toBe('{"foo":"bar","n":42}');
  });

  test('handles missing values', () => {
    const source = new SourceFormat({}, jest.fn());

    expect(source.convert(null, HTML_CONTEXT_TYPE)).toBe(
      '<span class="ffString__emptyValue">(null)</span>'
    );
    expect(source.convert(undefined, HTML_CONTEXT_TYPE)).toBe(
      '<span class="ffString__emptyValue">(null)</span>'
    );
    expect(source.reactConvert(null)).toMatchInlineSnapshot(`
      <span
        className="ffString__emptyValue"
      >
        (null)
      </span>
    `);
    expect(source.reactConvert(undefined)).toMatchInlineSnapshot(`
      <span
        className="ffString__emptyValue"
      >
        (null)
      </span>
    `);
  });

  test('wraps a multi-value array with bracket notation', () => {
    const source = new SourceFormat({}, jest.fn());

    expect(source.convert([{ a: 1 }, { b: 2 }], TEXT_CONTEXT_TYPE)).toBe(
      '["{\\"a\\":1}","{\\"b\\":2}"]'
    );
    expect(source.convert([{ a: 1 }, { b: 2 }], HTML_CONTEXT_TYPE)).toBe(
      '<span class="ffArray__highlight">[</span>{&quot;a&quot;:1}<span class="ffArray__highlight">,</span> {&quot;b&quot;:2}<span class="ffArray__highlight">]</span>'
    );
    expect(source.reactConvert([{ a: 1 }, { b: 2 }])).toMatchInlineSnapshot(`
      <React.Fragment>
        <span
          className="ffArray__highlight"
        >
          [
        </span>
        {"a":1}
        <span
          className="ffArray__highlight"
        >
          ,
        </span>
         
        {"b":2}
        <span
          className="ffArray__highlight"
        >
          ]
        </span>
      </React.Fragment>
    `);
  });

  test('returns the single element without brackets for a one-element array', () => {
    const source = new SourceFormat({}, jest.fn());

    expect(source.convert([{ foo: 'bar' }], TEXT_CONTEXT_TYPE)).toBe('["{\\"foo\\":\\"bar\\"}"]');
    expect(source.convert([{ foo: 'bar' }], HTML_CONTEXT_TYPE)).toBe(
      '{&quot;foo&quot;:&quot;bar&quot;}'
    );
    expect(source.reactConvert([{ foo: 'bar' }])).toBe('{"foo":"bar"}');
  });
});
