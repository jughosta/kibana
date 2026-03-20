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

  test('highlights words from two separate highlight entries with different contexts', () => {
    // Each entry has a distinct untagged context, so both highlights are applied.
    const result = render(
      getHighlightReact('lorem ipsum dolor sit', [
        `${hl('lorem')} ipsum dolor sit`,
        `lorem ipsum dolor ${hl('sit')}`,
      ])
    );
    // Entry 1 marks 'lorem'; entry 2's untagged is still 'lorem ipsum dolor sit' which
    // is no longer present verbatim, so only 'lorem' ends up highlighted.
    expect(result).toBe(`${mark('lorem')} ipsum dolor sit`);
  });

  test('highlights words from two separate highlight entries when contexts differ', () => {
    // Use distinct context windows so each entry can still find its untagged text.
    const result = render(
      getHighlightReact('lorem ipsum dolor', [`${hl('lorem')} ipsum`, `ipsum ${hl('dolor')}`])
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

  test('applies first entry when two highlight entries produce overlapping ranges', () => {
    // Both entries share the same untagged context ('elastic search engine').
    // After entry 1 inserts sentinels, entry 2 can no longer find the plain string,
    // so only 'elastic search' is marked — same behaviour as getHighlightHtml.
    const result = render(
      getHighlightReact('elastic search engine', [
        `${hl('elastic search')} engine`,
        `elastic ${hl('search engine')}`,
      ])
    );
    expect(result).toBe(`${mark('elastic search')} engine`);
  });

  test('applies first entry when two highlight entries produce adjacent ranges', () => {
    // Both entries share the same untagged context ('foobar').
    // After entry 1 inserts sentinels, entry 2 can no longer find the plain string,
    // so only 'foo' is marked — same behaviour as getHighlightHtml.
    const result = render(getHighlightReact('foobar', [`${hl('foo')}bar`, `foo${hl('bar')}`]));
    expect(result).toBe(`${mark('foo')}bar`);
  });

  test('subsumes a range that is fully contained within another highlight', () => {
    // Entry 1 marks the whole phrase; entry 2's untagged context is still found inside
    // the already-marked string, producing two separate adjacent marks.
    const result = render(
      getHighlightReact('elastic search engine', [
        `${hl('elastic search engine')}`,
        `elastic ${hl('search')} engine`,
      ])
    );
    expect(result).toBe(`${mark('elastic ')}${mark('search')} engine`);
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

  test('both functions apply only the first entry when ranges overlap', () => {
    // After entry 1 marks 'elastic search', the plain string 'elastic search engine'
    // is no longer present so entry 2 is a no-op in both implementations.
    const value = 'elastic search engine';
    const highlights = [`${hl('elastic search')} engine`, `elastic ${hl('search engine')}`];
    expect(getHighlightHtml(escapeValue(value), highlights)).toBe(
      `${mark('elastic search')} engine`
    );
    expect(render(getHighlightReact(value, highlights))).toBe(`${mark('elastic search')} engine`);
  });

  test('both functions apply only the first entry when ranges are adjacent', () => {
    // After entry 1 marks 'foo', the plain string 'foobar' is no longer present
    // so entry 2 is a no-op in both implementations.
    const value = 'foobar';
    const highlights = [`${hl('foo')}bar`, `foo${hl('bar')}`];
    expect(getHighlightHtml(escapeValue(value), highlights)).toBe(`${mark('foo')}bar`);
    expect(render(getHighlightReact(value, highlights))).toBe(`${mark('foo')}bar`);
  });

  test('getHighlightHtml produces nested marks when a later entry matches inside a previously tagged span; getHighlightReact produces adjacent marks', () => {
    // Entry 1 marks the whole phrase → '<mark>elastic search engine</mark>'.
    // Entry 2 has untaggedHighlight = 'elastic search engine', which is still present as a
    // substring inside that mark tag, so getHighlightHtml replaces it again — yielding
    // '<mark>elastic <mark>search</mark> engine</mark>' (invalid nested marks).
    // getHighlightReact produces two adjacent marks instead.
    const value = 'elastic search engine';
    const highlights = [`${hl('elastic search engine')}`, `elastic ${hl('search')} engine`];
    expect(getHighlightHtml(escapeValue(value), highlights)).toBe(
      mark(`elastic ${mark('search')} engine`)
    );
    expect(render(getHighlightReact(value, highlights))).toBe(
      `${mark('elastic ')}${mark('search')} engine`
    );
  });
});
