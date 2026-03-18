/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import type { ReactNode } from 'react';

const arraySpan = (text: string) => <span className="ffArray__highlight">{text}</span>;

/**
 * Wraps an array value into React nodes with bracket/comma notation,
 * mirroring the HTML content type's array rendering.
 *
 * Single-element and empty arrays are passed through without brackets.
 *
 * This should be applied at the call site (e.g. formatFieldValueReact, FieldFormatValue)
 * rather than inside individual formatter's reactConvert, so that formatters which
 * override reactConvert get correct array rendering for free.
 */
export function wrapReactArray(
  val: unknown[],
  convertSingle: (v: unknown) => ReactNode
): ReactNode {
  if (val.length === 0) return '';

  const recurse = (v: unknown): ReactNode =>
    Array.isArray(v) ? wrapReactArray(v, convertSingle) : convertSingle(v);

  const subNodes = val.map(recurse);
  if (val.length === 1) return subNodes[0] ?? '';

  const useMultiLine = subNodes.some((n) => typeof n === 'string' && n.includes('\n'));

  const nodes: ReactNode[] = [arraySpan('[')];
  if (useMultiLine) nodes.push('\n  ');
  subNodes.forEach((node, i) => {
    nodes.push(useMultiLine && typeof node === 'string' ? node.replaceAll('\n', '\n  ') : node);
    if (i < subNodes.length - 1) {
      nodes.push(arraySpan(','));
      nodes.push(useMultiLine ? '\n  ' : ' ');
    }
  });
  if (useMultiLine) nodes.push('\n');
  nodes.push(arraySpan(']'));

  return <>{nodes}</>;
}
