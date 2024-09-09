/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useEffect } from 'react';

export const useCustomBrowserCopyForGrid = () => {
  useEffect(() => {
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('copy', handleCopy);
    };
  }, []);
};

function handleCopy(event: ClipboardEvent) {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  const ranges = Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i));
  const grid = document.querySelector('[role="grid"]');

  if (!ranges.length || !grid) {
    return;
  }

  let tsvData = '';
  let totalCellsCount = 0;
  let totalRowsCount = 0;

  const rows = grid.querySelectorAll('[role="row"]');
  rows.forEach((row) => {
    const cells = row.querySelectorAll(
      '[role="gridcell"]:not(.euiDataGridRowCell--controlColumn) .euiDataGridRowCell__content'
    );
    const cellsTextContent: string[] = [];
    let hasSelectedCellsInRow = false;

    cells.forEach((cell) => {
      if (ranges.some((range) => range?.intersectsNode(cell))) {
        cellsTextContent.push(cell.textContent || '');
        hasSelectedCellsInRow = true;
        totalCellsCount++;
      } else {
        cellsTextContent.push(''); // placeholder for empty cells
      }
    });

    if (cellsTextContent.length > 0 && hasSelectedCellsInRow) {
      tsvData += cellsTextContent.join('\t') + '\n';
      totalRowsCount++;
    }
  });

  if (totalRowsCount === 1) {
    tsvData = tsvData.trim();
  }

  if (totalCellsCount > 1 && tsvData && event.clipboardData) {
    event.preventDefault();
    event.clipboardData.setData('text/plain', tsvData);
  }
}
