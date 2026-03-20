/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import moment from 'moment-timezone';
import { RelativeDateFormat } from './relative_date';
import { HTML_CONTEXT_TYPE, TEXT_CONTEXT_TYPE } from '../content_types';

describe('Relative Date Format', () => {
  // Use a fixed date to avoid time-dependent output in array assertions
  const fixedDate = '2019-01-01T00:00:00.000Z';

  let formatter: RelativeDateFormat;

  beforeEach(() => {
    formatter = new RelativeDateFormat({}, jest.fn());
  });

  test('decoding a missing value', () => {
    expect(formatter.convert(null, TEXT_CONTEXT_TYPE)).toBe('(null)');
    expect(formatter.convert(undefined, TEXT_CONTEXT_TYPE)).toBe('(null)');
    expect(formatter.convert(null, HTML_CONTEXT_TYPE)).toBe(
      '<span class="ffString__emptyValue">(null)</span>'
    );
    expect(formatter.convert(undefined, HTML_CONTEXT_TYPE)).toBe(
      '<span class="ffString__emptyValue">(null)</span>'
    );
    expect(formatter.reactConvert(null)).toMatchInlineSnapshot(`
      <span
        className="ffString__emptyValue"
      >
        (null)
      </span>
    `);
    expect(formatter.reactConvert(undefined)).toMatchInlineSnapshot(`
      <span
        className="ffString__emptyValue"
      >
        (null)
      </span>
    `);
  });

  test('decoding invalid date should echo invalid value', () => {
    expect(formatter.convert('not a valid date')).toBe('not a valid date');
    expect(formatter.reactConvert('not a valid date')).toBe('not a valid date');
  });

  test('should parse date values', () => {
    const val = '2017-08-13T20:24:09.904Z';
    expect(formatter.convert(val)).toBe(moment(val).fromNow());
    expect(formatter.reactConvert(val)).toBe(moment(val).fromNow());
  });

  test('escapes HTML characters in html context via fallback', () => {
    expect(formatter.convert('<script>alert("test")</script>', HTML_CONTEXT_TYPE)).toBe(
      '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;'
    );
    expect(formatter.reactConvert('<script>alert("test")</script>')).toBe(
      '<script>alert("test")</script>'
    );
  });

  test('wraps a multi-value array with bracket notation', () => {
    const rel = moment(fixedDate).fromNow();
    expect(formatter.convert([fixedDate, fixedDate], TEXT_CONTEXT_TYPE)).toBe(
      `["${rel}","${rel}"]`
    );
    expect(formatter.convert([fixedDate, fixedDate], HTML_CONTEXT_TYPE)).toBe(
      `<span class="ffArray__highlight">[</span>${rel}<span class="ffArray__highlight">,</span> ${rel}<span class="ffArray__highlight">]</span>`
    );
    // Use React.isValidElement to verify a React element is returned without
    // capturing the time-relative string value in the snapshot
    expect(React.isValidElement(formatter.reactConvert([fixedDate, fixedDate]))).toBe(true);
  });

  test('returns the single element without brackets for a one-element array', () => {
    const rel = moment(fixedDate).fromNow();
    expect(formatter.convert([fixedDate], TEXT_CONTEXT_TYPE)).toBe(`["${rel}"]`);
    expect(formatter.convert([fixedDate], HTML_CONTEXT_TYPE)).toBe(rel);
    expect(formatter.reactConvert([fixedDate])).toBe(rel);
  });
});
