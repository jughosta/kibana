/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { EMPTY_LABEL, MISSING_TOKEN, NULL_LABEL } from '@kbn/field-formats-common';

/**
 * Checks for missing values and returns appropriate HTML representation
 * Used by both FieldFormat class and HTML content type fallback
 *
 * @param val - The value to check
 * @returns HTML string for missing values, or void if value is present
 */
export const checkForMissingValueHtml = (val: unknown): string | void => {
  if (val === '') {
    return `<span class="ffString__emptyValue">${EMPTY_LABEL}</span>`;
  }
  if (val == null || val === MISSING_TOKEN) {
    return `<span class="ffString__emptyValue">${NULL_LABEL}</span>`;
  }
};
