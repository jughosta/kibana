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
import { HTML_CONTEXT_TYPE } from '../content_types';

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
});

describe('Source Format — reactConvert', () => {
  test('returns a plain JSON string for an object', () => {
    const formatter = new SourceFormat({}, jest.fn());
    expect(formatter.reactConvert({ foo: 'bar', n: 42 })).toMatchInlineSnapshot(
      `"{\\"foo\\":\\"bar\\",\\"n\\":42}"`
    );
  });

  test('returns null placeholder for null', () => {
    const formatter = new SourceFormat({}, jest.fn());
    expect(formatter.reactConvert(null)).toMatchInlineSnapshot(`
      <span
        className="ffString__emptyValue"
      >
        (null)
      </span>
    `);
  });

  test('wraps a multi-value array with bracket notation', () => {
    const formatter = new SourceFormat({}, jest.fn());
    expect(formatter.reactConvert([{ a: 1 }, { b: 2 }])).toMatchInlineSnapshot(`
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
    const formatter = new SourceFormat({}, jest.fn());
    expect(formatter.reactConvert([{ foo: 'bar' }])).toMatchInlineSnapshot(
      `"{\\"foo\\":\\"bar\\"}"`
    );
  });
});
