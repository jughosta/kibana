/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiDataGridStyle } from '@elastic/eui';

// data types
export const kibanaJSON = 'kibana-json';
export const GRID_STYLE = {
  border: 'horizontal',
  fontSize: 's',
  cellPadding: 'm',
  rowHover: 'highlight',
} as EuiDataGridStyle;

export const defaultTimeColumnWidth = 210;
export const toolbarVisibility = {
  showColumnSelector: {
    allowHide: false,
    allowReorder: true,
  },
};

export const defaultMonacoEditorWidth = 370;
