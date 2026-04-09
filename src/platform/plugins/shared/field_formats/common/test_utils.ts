/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ReactElement } from 'react';
import { NULL_LABEL, EMPTY_LABEL } from '@kbn/field-formats-common';

const EMPTY_VALUE_CLASS = 'ffString__emptyValue';
const ARRAY_HIGHLIGHT_CLASS = 'ffArray__highlight';

/**
 * Asserts that a React element is actually a plain string (not a React element).
 * This is used when reactConvert returns the value as-is without wrapping.
 */
export const expectReactElementAsString = (element: React.ReactNode, expectedValue: string) => {
  expect(typeof element).toBe('string');
  expect(element).toBe(expectedValue);
};

/**
 * Asserts that a React element represents a null value display.
 * Expects a span with className "ffString__emptyValue" and text "(null)".
 */
export const expectReactElementWithNull = (element: React.ReactNode) => {
  const el = element as ReactElement;
  expect(el.type).toBe('span');
  expect(el.props.className).toBe(EMPTY_VALUE_CLASS);
  expect(el.props.children).toBe(NULL_LABEL);
};

/**
 * Asserts that a React element represents a blank value display.
 * Expects a span with className "ffString__emptyValue" and text "(blank)".
 */
export const expectReactElementWithBlank = (element: React.ReactNode) => {
  const el = element as ReactElement;
  expect(el.type).toBe('span');
  expect(el.props.className).toBe(EMPTY_VALUE_CLASS);
  expect(el.props.children).toBe(EMPTY_LABEL);
};

/**
 * Asserts that a React element represents an array with bracket notation.
 * Expects a React.Fragment with [value1, value2, ...] structure where
 * brackets and commas are wrapped in spans with className "ffArray__highlight".
 */
export const expectReactElementAsArray = (element: React.ReactNode, expectedValues: string[]) => {
  const el = element as ReactElement;
  expect(el.type).toBe(Symbol.for('react.fragment'));

  const children = el.props.children as React.ReactNode[];

  // Expected structure: [bracket, value1, comma, ' ', value2, ..., bracket]
  expect(children).toHaveLength(3 * expectedValues.length);

  // Check opening bracket
  const openBracket = children[0] as ReactElement;
  expect(openBracket.type).toBe('span');
  expect(openBracket.props.className).toBe(ARRAY_HIGHLIGHT_CLASS);
  expect(openBracket.props.children).toBe('[');

  // Check values and separators
  expectedValues.forEach((value, index) => {
    const valueIndex = 1 + index * 3;
    expect(children[valueIndex]).toBe(value);

    if (index < expectedValues.length - 1) {
      // Check comma
      const comma = children[valueIndex + 1] as ReactElement;
      expect(comma.type).toBe('span');
      expect(comma.props.className).toBe(ARRAY_HIGHLIGHT_CLASS);
      expect(comma.props.children).toBe(',');

      // Check space
      expect(children[valueIndex + 2]).toBe(' ');
    }
  });

  // Check closing bracket
  const closeBracket = children[children.length - 1] as ReactElement;
  expect(closeBracket.type).toBe('span');
  expect(closeBracket.props.className).toBe(ARRAY_HIGHLIGHT_CLASS);
  expect(closeBracket.props.children).toBe(']');
};
