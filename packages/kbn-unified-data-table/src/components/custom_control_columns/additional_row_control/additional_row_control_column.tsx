/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useContext, useEffect, useMemo, useRef } from 'react';
import {
  EuiButtonIcon,
  EuiDataGridCellValueElementProps,
  EuiDataGridControlColumn,
  EuiScreenReaderOnly,
  EuiToolTip,
} from '@elastic/eui';
import { UnifiedDataTableContext } from '../../../table_context';
import { DataTableRowControl } from '../../data_table_row_control';
import { RowControlColumn } from '../../../types';

/**
 * Button for an additional custom control column
 */
export const AdditionalRowControlButton = ({
  columnId,
  rowIndex,
  setCellProps,
  getRowControlParams,
}: EuiDataGridCellValueElementProps & {
  getRowControlParams: RowControlColumn['getRowControlParams'];
}) => {
  const toolTipRef = useRef<EuiToolTip>(null);
  const { expanded, rows, isDarkMode } = useContext(UnifiedDataTableContext);
  const record = useMemo(() => rows[rowIndex], [rows, rowIndex]);
  const { label, iconType, onClick } = getRowControlParams({ rowIndex, record });

  useEffect(() => {
    if (record.isAnchor) {
      setCellProps({
        className: 'unifiedDataTable__cell--highlight',
      });
    } else if (expanded && record && expanded.id === record.id) {
      setCellProps({
        className: 'unifiedDataTable__cell--expanded',
      });
    } else {
      setCellProps({ className: undefined });
    }
  }, [expanded, record, setCellProps, isDarkMode]);

  return (
    <DataTableRowControl>
      <EuiToolTip content={label} delay="long" ref={toolTipRef}>
        <EuiButtonIcon
          size="xs"
          iconSize="s"
          aria-label={label}
          data-test-subj={`unifiedDataTable_rowControl_${columnId}`}
          onClick={() => {
            onClick({ rowIndex, record });
          }}
          iconType={iconType}
          color="text"
        />
      </EuiToolTip>
    </DataTableRowControl>
  );
};

export const getAdditionalRowControlColumn = (
  rowControlColumn: RowControlColumn
): EuiDataGridControlColumn => {
  const { id, headerAriaLabel, getRowControlParams } = rowControlColumn;

  return {
    id: `additionalRowControl_${id}`,
    width: 24,
    headerCellRender: () => (
      <EuiScreenReaderOnly>
        <span>{headerAriaLabel}</span>
      </EuiScreenReaderOnly>
    ),
    rowCellRender: (props) => {
      return <AdditionalRowControlButton {...props} getRowControlParams={getRowControlParams} />;
    },
  };
};
