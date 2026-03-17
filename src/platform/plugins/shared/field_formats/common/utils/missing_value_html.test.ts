/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { checkForMissingValueHtml } from './missing_value_html';

describe('checkForMissingValueHtml', () => {
  test('returns HTML for empty string', () => {
    expect(checkForMissingValueHtml('')).toBe('<span class="ffString__emptyValue">(blank)</span>');
  });

  test('returns HTML for null', () => {
    expect(checkForMissingValueHtml(null)).toBe('<span class="ffString__emptyValue">(null)</span>');
  });

  test('returns HTML for undefined', () => {
    expect(checkForMissingValueHtml(undefined)).toBe('<span class="ffString__emptyValue">(null)</span>');
  });

  test('returns HTML for missing token', () => {
    expect(checkForMissingValueHtml('__missing__')).toBe('<span class="ffString__emptyValue">(null)</span>');
  });

  test('returns void for valid values', () => {
    expect(checkForMissingValueHtml('valid value')).toBeUndefined();
    expect(checkForMissingValueHtml(0)).toBeUndefined();
    expect(checkForMissingValueHtml(false)).toBeUndefined();
    expect(checkForMissingValueHtml([])).toBeUndefined();
    expect(checkForMissingValueHtml({})).toBeUndefined();
  });
});