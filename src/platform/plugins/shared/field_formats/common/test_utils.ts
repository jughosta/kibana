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
export const expectReactElementAsArray = (
  element: React.ReactNode,
  expectedValues: Array<React.ReactNode>
) => {
  const el = element as ReactElement;
  expect(el.type).toBe(Symbol.for('react.fragment'));

  const children = el.props.children as React.ReactNode[];

  // Build expected children: [bracket, value1, comma, ' ', value2, comma, ' ', value3, ..., bracket]
  const expectedChildren: React.ReactNode[] = [];

  // Opening bracket
  expectedChildren.push(
    expect.objectContaining({
      type: 'span',
      props: { className: ARRAY_HIGHLIGHT_CLASS, children: '[' },
    })
  );

  expectedValues.forEach((value, index) => {
    // Add the value
    expectedChildren.push(value);

    if (index < expectedValues.length - 1) {
      // Add comma separator
      expectedChildren.push(
        expect.objectContaining({
          type: 'span',
          props: { className: ARRAY_HIGHLIGHT_CLASS, children: ',' },
        })
      );
      // Add space
      expectedChildren.push(' ');
    }
  });

  // Closing bracket
  expectedChildren.push(
    expect.objectContaining({
      type: 'span',
      props: { className: ARRAY_HIGHLIGHT_CLASS, children: ']' },
    })
  );

  expect(children).toEqual(expectedChildren);
};
