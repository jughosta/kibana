/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { EMPTY_LABEL, NULL_LABEL } from '@kbn/field-formats-common';
import { HTML_CONTEXT_TYPE } from '../content_types';
import { highlightTags } from '../utils/highlight/highlight_tags';
import { StringFormat } from './string';

/**
 * Removes a wrapping span, that is created by the field formatter infrastructure
 * and we're not caring about in these tests.
 */
function stripSpan(input: string): string {
  return input.replace(/^\<span\>(.*)\<\/span\>$/, '$1');
}

describe('String Format', () => {
  const hl = (word: string) => `${highlightTags.pre}${word}${highlightTags.post}`;

  test('converts a string to lower case', () => {
    const string = new StringFormat({ transform: 'lower' }, jest.fn());
    expect(string.convert('Kibana')).toBe('kibana');
    expect(stripSpan(string.convert('Kibana', 'html'))).toBe('kibana');
    expect(string.reactConvert('Kibana')).toBe('kibana');
  });

  test('converts a string to upper case', () => {
    const string = new StringFormat({ transform: 'upper' }, jest.fn());
    expect(string.convert('Kibana')).toBe('KIBANA');
    expect(stripSpan(string.convert('Kibana', 'html'))).toBe('KIBANA');
    expect(string.reactConvert('Kibana')).toBe('KIBANA');
  });

  test('decodes a base64 string', () => {
    const string = new StringFormat({ transform: 'base64' }, jest.fn());
    expect(string.convert('Zm9vYmFy')).toBe('foobar');
    expect(stripSpan(string.convert('Zm9vYmFy', 'html'))).toBe('foobar');
    expect(string.reactConvert('Zm9vYmFy')).toBe('foobar');
  });

  test('converts a string to title case', () => {
    const string = new StringFormat({ transform: 'title' }, jest.fn());
    expect(string.convert('PLEASE DO NOT SHOUT')).toBe('Please Do Not Shout');
    expect(stripSpan(string.convert('PLEASE DO NOT SHOUT', 'html'))).toBe('Please Do Not Shout');
    expect(string.reactConvert('PLEASE DO NOT SHOUT')).toBe('Please Do Not Shout');

    expect(string.convert('Mean, variance and standard_deviation.')).toBe(
      'Mean, Variance And Standard_deviation.'
    );
    expect(stripSpan(string.convert('Mean, variance and standard_deviation.', 'html'))).toBe(
      'Mean, Variance And Standard_deviation.'
    );
    expect(string.reactConvert('Mean, variance and standard_deviation.')).toBe(
      'Mean, Variance And Standard_deviation.'
    );

    expect(string.convert('Stay CALM!')).toBe('Stay Calm!');
    expect(stripSpan(string.convert('Stay CALM!', 'html'))).toBe('Stay Calm!');
    expect(string.reactConvert('Stay CALM!')).toBe('Stay Calm!');
  });

  test('converts a string to short case', () => {
    const string = new StringFormat({ transform: 'short' }, jest.fn());
    expect(string.convert('dot.notated.string')).toBe('d.n.string');
    expect(stripSpan(string.convert('dot.notated.string', 'html'))).toBe('d.n.string');
    expect(string.reactConvert('dot.notated.string')).toBe('d.n.string');
  });

  test('converts a string with an unknown transform', () => {
    const string = new StringFormat({ transform: 'unknown_transform' }, jest.fn());
    const value = 'test test test';
    expect(string.convert(value)).toBe(value);
    expect(string.reactConvert(value)).toBe(value);
  });

  test('decodes a URL Param string', () => {
    const string = new StringFormat({ transform: 'urlparam' }, jest.fn());
    expect(string.convert('%EC%95%88%EB%85%95%20%ED%82%A4%EB%B0%94%EB%82%98')).toBe('안녕 키바나');
    expect(
      stripSpan(string.convert('%EC%95%88%EB%85%95%20%ED%82%A4%EB%B0%94%EB%82%98', 'html'))
    ).toBe('안녕 키바나');
    expect(string.reactConvert('%EC%95%88%EB%85%95%20%ED%82%A4%EB%B0%94%EB%82%98')).toBe(
      '안녕 키바나'
    );
  });

  test('outputs a specific empty value', () => {
    const string = new StringFormat();
    expect(string.convert('')).toBe(EMPTY_LABEL);
    expect(stripSpan(string.convert('', HTML_CONTEXT_TYPE))).toBe(
      `<span class="ffString__emptyValue">${EMPTY_LABEL}</span>`
    );
    expect(string.reactConvert('')).toMatchInlineSnapshot(`
      <span
        className="ffString__emptyValue"
      >
        (blank)
      </span>
    `);
  });

  test('outputs a specific missing value', () => {
    const string = new StringFormat();
    expect(string.convert(null)).toBe(NULL_LABEL);
    expect(string.convert(undefined)).toBe(NULL_LABEL);
    expect(stripSpan(string.convert(null, HTML_CONTEXT_TYPE))).toBe(
      `<span class="ffString__emptyValue">${NULL_LABEL}</span>`
    );
    expect(stripSpan(string.convert(undefined, HTML_CONTEXT_TYPE))).toBe(
      `<span class="ffString__emptyValue">${NULL_LABEL}</span>`
    );
    expect(string.reactConvert(null)).toMatchInlineSnapshot(`
      <span
        className="ffString__emptyValue"
      >
        (null)
      </span>
    `);
    expect(string.reactConvert(undefined)).toMatchInlineSnapshot(`
      <span
        className="ffString__emptyValue"
      >
        (null)
      </span>
    `);
  });

  test('wraps highlighted text in <mark>', () => {
    const string = new StringFormat();
    expect(
      stripSpan(
        string.convert('<img />', 'html', {
          field: { name: 'foo' },
          hit: {
            highlight: { foo: ['@kibana-highlighted-field@<img />@/kibana-highlighted-field@'] },
          },
        })
      )
    ).toBe('<mark class="ffSearch__highlight">&lt;img /&gt;</mark>');
    expect(
      string.reactConvert('<img />', {
        field: { name: 'foo' },
        hit: { highlight: { foo: [`${hl('<img />')}`] } },
      })
    ).toMatchInlineSnapshot(`
      <mark
        className="ffSearch__highlight"
      >
        &lt;img /&gt;
      </mark>
    `);
  });

  test('escapes HTML characters', () => {
    const string = new StringFormat();
    expect(string.convert('<script>alert("test")</script>', HTML_CONTEXT_TYPE)).toBe(
      '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;'
    );
    expect(string.reactConvert('<script>alert("xss")</script>')).toBe(
      '<script>alert("xss")</script>'
    );
  });

  test('wraps a multi-value array with bracket notation', () => {
    const string = new StringFormat();

    expect(string.convert(['foo', 'bar'], 'text')).toBe('["foo","bar"]');
    expect(string.convert(['foo', 'bar'], HTML_CONTEXT_TYPE)).toBe(
      '<span class="ffArray__highlight">[</span>foo<span class="ffArray__highlight">,</span> bar<span class="ffArray__highlight">]</span>'
    );
    expect(string.reactConvert(['foo', 'bar'])).toMatchInlineSnapshot(`
      <React.Fragment>
        <span
          className="ffArray__highlight"
        >
          [
        </span>
        foo
        <span
          className="ffArray__highlight"
        >
          ,
        </span>
         
        bar
        <span
          className="ffArray__highlight"
        >
          ]
        </span>
      </React.Fragment>
    `);
  });

  test('returns the single element without brackets for a one-element array', () => {
    const string = new StringFormat();

    expect(string.convert(['hello'], 'text')).toBe('["hello"]');
    expect(string.convert(['hello'], HTML_CONTEXT_TYPE)).toBe('hello');
    expect(string.reactConvert(['hello'])).toBe('hello');
  });

  test('returns empty for an empty array', () => {
    const string = new StringFormat();

    expect(string.convert([], 'text')).toBe('[]');
    expect(string.convert([], HTML_CONTEXT_TYPE)).toBe('');
    expect(string.reactConvert([])).toBe('');
  });
});
