/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { highlightTags } from './highlight_tags';

/**
 * React equivalent of getHighlightHtml. Mirrors the same split-and-rejoin algorithm:
 * for each highlight entry, strip its tags to get the plain context string, then
 * replace every occurrence of that context in the working string with the
 * highlight-tagged version. The result is converted to React <mark> nodes —
 * no dangerouslySetInnerHTML needed.
 */
export function getHighlightReact(
  fieldValue: string | object,
  highlights: string[] | undefined | null
): React.ReactNode {
  const text = typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue);

  if (!highlights?.length) return text;

  // Direct mirror of getHighlightHtml: untagged → plain context, tagged → highlight as-is.
  let result = text;
  for (const highlight of highlights) {
    const untagged = highlight.split(highlightTags.pre).join('').split(highlightTags.post).join('');
    result = result.split(untagged).join(highlight);
  }

  if (!result.includes(highlightTags.pre)) return text;

  // Split on the opening tag; every segment after the first contains highlighted text
  // up to the closing tag, followed by optional plain text.
  const nodes: React.ReactNode[] = [];
  const parts = result.split(highlightTags.pre);

  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      if (parts[i]) nodes.push(parts[i]);
    } else {
      const [highlighted, rest] = parts[i].split(highlightTags.post);
      if (highlighted) {
        nodes.push(
          <mark className="ffSearch__highlight" key={i}>
            {highlighted}
          </mark>
        );
      }
      if (rest) nodes.push(rest);
    }
  }

  if (nodes.length === 0) return text;
  if (nodes.length === 1) return nodes[0];
  return <>{nodes}</>;
}
