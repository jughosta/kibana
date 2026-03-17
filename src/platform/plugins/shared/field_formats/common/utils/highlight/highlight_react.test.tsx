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
import { highlightTags } from './highlight_tags';
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
});
