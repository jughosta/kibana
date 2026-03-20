/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import ReactDOM from 'react-dom/server';
import { escape } from 'lodash';
import { highlightTags } from './highlight_tags';
import { getHighlightHtml } from './highlight_html';
import { getHighlightReact } from './highlight_react';

/** Render the ReactNode to a plain HTML string for easy assertion.
 * &quot; is decoded back to " since both are valid HTML and the difference is
 * an implementation detail of renderToStaticMarkup, not semantically meaningful.
 */
function render(node: React.ReactNode): string {
  return ReactDOM.renderToStaticMarkup(<>{node}</>).replace(/&quot;/g, '"');
}

const hl = (word: string) => `${highlightTags.pre}${word}${highlightTags.post}`;
const mark = (word: string) => `<mark class="ffSearch__highlight">${word}</mark>`;

describe('getHighlightReact', () => {
  test('returns the plain string unchanged when highlights are empty', () => {
    expect(getHighlightReact('lorem ipsum', undefined)).toBe('lorem ipsum');
    expect(getHighlightReact('lorem ipsum', null)).toBe('lorem ipsum');
    expect(getHighlightReact('lorem ipsum', [])).toBe('lorem ipsum');
  });

  test('returns the plain string unchanged when no highlight matches the field value', () => {
    const result = render(getHighlightReact('lorem ipsum', [`${hl('dolor')}`]));
    expect(result).toBe('lorem ipsum');
  });

  test('highlights a single word at the start', () => {
    const result = render(getHighlightReact('lorem ipsum dolor', [`${hl('lorem')} ipsum dolor`]));
    expect(result).toBe(`${mark('lorem')} ipsum dolor`);
  });

  test('highlights a single word in the middle', () => {
    const result = render(getHighlightReact('lorem ipsum dolor', [`lorem ${hl('ipsum')} dolor`]));
    expect(result).toBe(`lorem ${mark('ipsum')} dolor`);
  });

  test('highlights a single word at the end', () => {
    const result = render(getHighlightReact('lorem ipsum dolor', [`lorem ipsum ${hl('dolor')}`]));
    expect(result).toBe(`lorem ipsum ${mark('dolor')}`);
  });

  test('highlights two words within one highlight entry', () => {
    const result = render(
      getHighlightReact('lorem ipsum dolor sit', [`lorem ${hl('ipsum')} dolor ${hl('sit')}`])
    );
    expect(result).toBe(`lorem ${mark('ipsum')} dolor ${mark('sit')}`);
  });

  test('highlights the same word appearing multiple times via multiple highlight entries', () => {
    // ES returns one fragment per context window; multiple entries cover all occurrences
    const result = render(
      getHighlightReact('lorem ipsum lorem ipsum lorem', [
        `${hl('lorem')} ipsum lorem`,
        `ipsum ${hl('lorem')} ipsum ${hl('lorem')}`,
      ])
    );
    expect(result).toBe(`${mark('lorem')} ipsum ${mark('lorem')} ipsum ${mark('lorem')}`);
  });

  test('highlights words from two separate highlight entries', () => {
    const result = render(
      getHighlightReact('lorem ipsum dolor', [
        `${hl('lorem')} ipsum dolor`,
        `lorem ipsum ${hl('dolor')}`,
      ])
    );
    expect(result).toBe(`${mark('lorem')} ipsum ${mark('dolor')}`);
  });

  test('highlights the entire field value', () => {
    const result = render(getHighlightReact('lorem', [`${hl('lorem')}`]));
    expect(result).toBe(mark('lorem'));
  });

  test('HTML-escapes special characters inside a highlighted word', () => {
    const result = render(getHighlightReact('<b>bold</b>', [`${hl('<b>bold</b>')}`]));
    expect(result).toBe(mark('&lt;b&gt;bold&lt;/b&gt;'));
    expect(result).not.toContain('<b>');
  });

  test('HTML-escapes special characters in non-highlighted parts', () => {
    const result = render(getHighlightReact('<em>lorem</em> ipsum', [`${hl('ipsum')}`]));
    expect(result).toBe(`&lt;em&gt;lorem&lt;/em&gt; ${mark('ipsum')}`);
    expect(result).not.toContain('<em>');
  });

  test('HTML-escapes the field value when there are no matching highlights', () => {
    const result = render(getHighlightReact('<script>alert(1)</script>', []));
    expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('does not highlight partial word matches', () => {
    // 'ipsum' fragment should not highlight the 'ipsum' inside 'loremipsum'
    const result = render(getHighlightReact('loremipsum lorem ipsum', [`lorem ${hl('ipsum')}`]));
    expect(result).toBe(`loremipsum lorem ${mark('ipsum')}`);
  });

  test('accepts an object field value and stringifies it', () => {
    const result = render(getHighlightReact({ foo: 1, bar: 2 }, [`{"foo":1,${hl('"bar":2')}`]));
    expect(result).toBe(`{"foo":1,${mark('"bar":2')}}`);
  });

  test('merges overlapping ranges from two highlight entries into a single mark', () => {
    // Entry 1 marks "elastic search" [0,14], entry 2 marks "search engine" [8,21].
    // The ranges overlap at "search" [8,14] and must be merged into one mark.
    const result = render(
      getHighlightReact('elastic search engine', [
        `${hl('elastic search')} engine`,
        `elastic ${hl('search engine')}`,
      ])
    );
    expect(result).toBe(mark('elastic search engine'));
  });

  test('merges adjacent ranges from two highlight entries into a single mark', () => {
    // Entry 1 marks "foo" [0,3], entry 2 marks "bar" [3,6].
    // The ranges share a boundary and must be merged into one mark.
    const result = render(getHighlightReact('foobar', [`${hl('foo')}bar`, `foo${hl('bar')}`]));
    expect(result).toBe(mark('foobar'));
  });

  test('subsumes a range that is fully contained within another highlight', () => {
    // Entry 1 marks the whole phrase [0,21], entry 2 marks only "search" [8,14].
    // The smaller range is swallowed by the larger one.
    const result = render(
      getHighlightReact('elastic search engine', [
        `${hl('elastic search engine')}`,
        `elastic ${hl('search')} engine`,
      ])
    );
    expect(result).toBe(mark('elastic search engine'));
  });
});

/**
 * Testing the new getHighlightReact by comparing it to the old getHighlightHtml.
 */
describe('getHighlightReact vs getHighlightHtml', () => {
  /**
   * In production, getHighlightHtml is always called with a pre-escaped field value —
   * html_content_type.ts runs `escape(format.convert(value, 'text'))` before the call.
   * The helper below mirrors that contract so the comparison is valid.
   */
  const escapeValue = (value: string): string => escape(value);

  /**
   * When getHighlightHtml receives a pre-escaped field value (as html_content_type.ts provides),
   * both functions produce identical HTML — including for values with HTML special characters,
   * because the escaped form of the highlight matches the pre-escaped field value string.
   */
  describe('produces matching output when field value is pre-escaped for getHighlightHtml', () => {
    const cases: Array<[string, string, string[] | undefined]> = [
      ['returns plain string when highlights are undefined', 'lorem ipsum', undefined],
      ['returns plain string when highlights are empty', 'lorem ipsum', []],
      ['returns plain string when no highlight matches', 'lorem ipsum', [`${hl('dolor')}`]],
      ['highlights a word at the start', 'lorem ipsum dolor', [`${hl('lorem')} ipsum dolor`]],
      ['highlights a word in the middle', 'lorem ipsum dolor', [`lorem ${hl('ipsum')} dolor`]],
      ['highlights a word at the end', 'lorem ipsum dolor', [`lorem ipsum ${hl('dolor')}`]],
      [
        'highlights two words within one entry',
        'lorem ipsum dolor sit',
        [`lorem ${hl('ipsum')} dolor ${hl('sit')}`],
      ],
      ['highlights the entire field value', 'lorem', [`${hl('lorem')}`]],
      [
        'does not highlight partial word matches',
        'loremipsum lorem ipsum',
        [`lorem ${hl('ipsum')}`],
      ],
      [
        'highlights a value that consists entirely of HTML special characters',
        '<b>bold</b>',
        [`${hl('<b>bold</b>')}`],
      ],
      [
        'highlights a plain word in a value that contains HTML tags',
        '<em>lorem</em> ipsum',
        [`${hl('ipsum')}`],
      ],
    ];

    test.each(cases)('%s', (_label, value, highlights) => {
      expect(render(getHighlightReact(value, highlights))).toBe(
        getHighlightHtml(escapeValue(value), highlights)
      );
    });
  });

  /**
   * getHighlightHtml requires the caller to pre-escape the field value; passing a raw
   * value bypasses that contract and produces unsafe output. getHighlightReact is always
   * safe because it relies on React's built-in escaping rather than delegating to the caller.
   */
  test('getHighlightHtml produces unsafe output without pre-escaping; getHighlightReact is always safe', () => {
    const rawValue = '<script>alert(1)</script>';
    const safeExpected = '&lt;script&gt;alert(1)&lt;/script&gt;';
    // Incorrect usage: raw value passed without escaping
    expect(getHighlightHtml(rawValue, [])).not.toBe(safeExpected);
    // Correct usage: pre-escaped value
    expect(getHighlightHtml(escape(rawValue), [])).toBe(safeExpected);
    // getHighlightReact is safe regardless — no pre-escaping needed by the caller
    expect(render(getHighlightReact(rawValue, []))).toBe(safeExpected);
  });

  test('getHighlightHtml loses the second highlight when ranges overlap; getHighlightReact merges them', () => {
    // getHighlightHtml is sequential: entry 1 replaces 'elastic search engine' with
    // '<mark>elastic search</mark> engine', so entry 2 can no longer find the untagged
    // string 'elastic search engine' in the already-modified output.
    const value = 'elastic search engine';
    const highlights = [`${hl('elastic search')} engine`, `elastic ${hl('search engine')}`];
    expect(getHighlightHtml(escapeValue(value), highlights)).toBe(
      `${mark('elastic search')} engine`
    );
    expect(render(getHighlightReact(value, highlights))).toBe(mark('elastic search engine'));
  });

  test('getHighlightHtml loses the second highlight when ranges are adjacent; getHighlightReact merges them', () => {
    // Same root cause: after entry 1 turns 'foobar' into '<mark>foo</mark>bar', entry 2
    // searches for the context string 'foobar' which is no longer present.
    const value = 'foobar';
    const highlights = [`${hl('foo')}bar`, `foo${hl('bar')}`];
    expect(getHighlightHtml(escapeValue(value), highlights)).toBe(`${mark('foo')}bar`);
    expect(render(getHighlightReact(value, highlights))).toBe(mark('foobar'));
  });

  test('getHighlightHtml produces nested marks when a later entry matches inside a previously tagged span; getHighlightReact produces a single mark', () => {
    // Entry 1 marks the whole phrase → '<mark>elastic search engine</mark>'.
    // Entry 2 has untaggedHighlight = 'elastic search engine', which is still present as a
    // substring inside that mark tag, so getHighlightHtml replaces it again — yielding
    // '<mark>elastic <mark>search</mark> engine</mark>' (invalid nested marks).
    const value = 'elastic search engine';
    const highlights = [`${hl('elastic search engine')}`, `elastic ${hl('search')} engine`];
    expect(getHighlightHtml(escapeValue(value), highlights)).toBe(
      mark(`elastic ${mark('search')} engine`)
    );
    expect(render(getHighlightReact(value, highlights))).toBe(mark('elastic search engine'));
  });
});
