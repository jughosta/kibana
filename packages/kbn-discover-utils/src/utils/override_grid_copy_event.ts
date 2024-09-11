/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { ClipboardEvent } from 'react';

interface OverrideGridCopyEventParams {
  event: ClipboardEvent<HTMLDivElement>;
  dataGridWrapper: HTMLElement | null;
}

export function overrideGridCopyEvent({ event, dataGridWrapper }: OverrideGridCopyEventParams) {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  const ranges = Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i));

  if (!ranges.length || !event.clipboardData?.setData || !dataGridWrapper) {
    return;
  }

  let tsvData = '';
  let totalCellsCount = 0;
  let totalRowsCount = 0;

  const rows = dataGridWrapper.querySelectorAll('[role="row"]');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('[role="gridcell"]');

    const cellsTextContent: string[] = [];
    let hasSelectedCellsInRow = false;

    cells.forEach((cell) => {
      if (
        cell.classList?.contains?.('euiDataGridRowCell--controlColumn') &&
        cell.getAttribute('data-gridcell-column-id') !== 'timeline-event-detail-row' // in Security Solution "Event renderes" are appended as control column
      ) {
        // skip controls
        return;
      }

      const cellContent = cell.querySelector('.euiDataGridRowCell__content');
      if (!cellContent) {
        return;
      }

      // get text content of selected cells
      if (ranges.some((range) => range?.intersectsNode(cell))) {
        cellsTextContent.push(getCellTextContent(cellContent));
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

  if (totalCellsCount > 1 && tsvData) {
    event.preventDefault();
    event.clipboardData.setData('text/plain', tsvData);
  }
}

function getCellTextContent(cell: Element) {
  const cellCloned = cell.cloneNode(true) as HTMLElement;

  // a field value can be formatted as an image or audio => replace it with the src
  replaceWithSrcTextNode(cellCloned, 'img');
  replaceWithSrcTextNode(cellCloned, 'audio');

  // remove field tokens so field types don't get copied
  dropBySelector(cellCloned, '.kbnFieldIcon');

  // for Document column
  appendTextToSelector(cellCloned, '.unifiedDataTable__descriptionListTitle', ': ');
  appendTextToSelector(cellCloned, '.unifiedDataTable__descriptionListDescription', ', ', true);

  return cellCloned.textContent || '';
}

function replaceWithSrcTextNode(element: HTMLElement, tagName: 'img' | 'audio') {
  const tags = element.querySelectorAll('img');

  tags.forEach((tag) => {
    const textNode = document.createTextNode(tag.src);
    tag.parentNode?.replaceChild(textNode, tag);
  });
}

function dropBySelector(element: HTMLElement, selector: string) {
  const elements = element.querySelectorAll(selector);
  elements.forEach((el) => el.remove());
}

function appendTextToSelector(
  element: HTMLElement,
  selector: string,
  text: string,
  skipLast: boolean | undefined = false
) {
  const elements = element.querySelectorAll(selector);
  elements.forEach((el, index) => {
    if (skipLast && index === elements.length - 1) {
      return;
    }
    const textNode = document.createTextNode(text);
    el.appendChild(textNode);
  });
}
