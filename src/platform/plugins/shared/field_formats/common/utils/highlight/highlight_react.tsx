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

interface Segment {
  text: string;
  highlighted: boolean;
}

/**
 * Parses a single ES highlight string (which may contain multiple marker pairs) into segments.
 */
function parseHighlight(highlight: string): Segment[] {
  const segments: Segment[] = [];
  const parts = highlight.split(highlightTags.pre);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === 0) {
      if (part) segments.push({ text: part, highlighted: false });
    } else {
      const postIdx = part.indexOf(highlightTags.post);
      if (postIdx === -1) {
        // Malformed highlight — treat remaining as highlighted to avoid data loss
        segments.push({ text: part, highlighted: true });
      } else {
        const hlText = part.slice(0, postIdx);
        const rest = part.slice(postIdx + highlightTags.post.length);
        if (hlText) segments.push({ text: hlText, highlighted: true });
        if (rest) segments.push({ text: rest, highlighted: false });
      }
    }
  }

  return segments;
}

/**
 * React equivalent of getHighlightHtml. Parses ES highlight markers and returns
 * React nodes with matched portions wrapped in <mark> — no dangerouslySetInnerHTML needed.
 *
 * Algorithm: for each highlight entry, locate the untagged substring in the original field
 * value and record the character ranges of the highlighted sub-spans. After collecting all
 * ranges, merge overlapping ones and build React nodes in a single pass.
 */
export function getHighlightReact(
  fieldValue: string | object,
  highlights: string[] | undefined | null
): React.ReactNode {
  const text = typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue);

  if (!highlights?.length) return text;

  // Collect [start, end) character ranges to highlight in the original text
  const markRanges: Array<[number, number]> = [];

  for (const highlight of highlights) {
    const segments = parseHighlight(highlight);
    const untagged = segments.map((s) => s.text).join('');
    if (!untagged) continue;

    // Find every occurrence of the untagged substring in the original text and record
    // which sub-spans within each occurrence correspond to highlighted segments.
    let searchFrom = 0;
    while (searchFrom <= text.length) {
      const matchIdx = text.indexOf(untagged, searchFrom);
      if (matchIdx === -1) break;

      let offset = matchIdx;
      for (const seg of segments) {
        const segEnd = offset + seg.text.length;
        if (seg.highlighted) {
          markRanges.push([offset, segEnd]);
        }
        offset = segEnd;
      }

      searchFrom = matchIdx + untagged.length;
    }
  }

  if (markRanges.length === 0) return text;

  // Sort ranges by start position and merge overlapping ones
  markRanges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [start, end] of markRanges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  // Build React nodes from the merged ranges
  const nodes: React.ReactNode[] = [];
  let pos = 0;
  for (const [start, end] of merged) {
    if (pos < start) nodes.push(text.slice(pos, start));
    nodes.push(
      <mark className="ffSearch__highlight" key={start}>
        {text.slice(start, end)}
      </mark>
    );
    pos = end;
  }
  if (pos < text.length) nodes.push(text.slice(pos));

  const filtered = nodes.filter((n) => n !== '');
  if (filtered.length === 0) return text;
  if (filtered.length === 1) return filtered[0];
  return <>{filtered}</>;
}
