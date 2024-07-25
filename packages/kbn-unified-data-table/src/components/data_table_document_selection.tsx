/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  EuiCheckbox,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiCopy,
  EuiDataGridCellValueElementProps,
  EuiDataGridToolbarControl,
  EuiPopover,
  EuiFlexGroup,
  EuiFlexItem,
  useEuiTheme,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';
import { css } from '@emotion/react';
import type { DataTableRecord } from '@kbn/discover-utils/types';
import { UnifiedDataTableContext } from '../table_context';
import { useControlColumn } from '../hooks/use_control_column';

export const SelectButton = (props: EuiDataGridCellValueElementProps) => {
  const { record, rowIndex } = useControlColumn(props);
  const { euiTheme } = useEuiTheme();
  const { selectedDocs, setSelectedDocs } = useContext(UnifiedDataTableContext);
  const checked = useMemo(() => selectedDocs.includes(record.id), [selectedDocs, record.id]);

  const toggleDocumentSelectionLabel = i18n.translate('unifiedDataTable.grid.selectDoc', {
    defaultMessage: `Select document ''{rowNumber}''`,
    values: { rowNumber: rowIndex + 1 },
  });

  return (
    <EuiFlexGroup
      responsive={false}
      direction="column"
      justifyContent="center"
      className="unifiedDataTable__rowControl"
      css={css`
        padding-block: ${euiTheme.size.xs}; // to have the same height as "openDetails" control
        padding-left: ${euiTheme.size.xs}; // space between controls
      `}
    >
      <EuiFlexItem grow={false}>
        <EuiCheckbox
          id={record.id}
          aria-label={toggleDocumentSelectionLabel}
          checked={checked}
          data-test-subj={`dscGridSelectDoc-${record.id}`}
          onChange={() => {
            if (checked) {
              const newSelection = selectedDocs.filter((docId) => docId !== record.id);
              setSelectedDocs(newSelection);
            } else {
              setSelectedDocs([...selectedDocs, record.id]);
            }
          }}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export function DataTableDocumentToolbarBtn({
  isPlainRecord,
  isFilterActive,
  rows,
  selectedDocs,
  setIsFilterActive,
  setSelectedDocs,
}: {
  isPlainRecord: boolean;
  isFilterActive: boolean;
  rows: DataTableRecord[];
  selectedDocs: string[];
  setIsFilterActive: (value: boolean) => void;
  setSelectedDocs: (value: string[]) => void;
}) {
  const [isSelectionPopoverOpen, setIsSelectionPopoverOpen] = useState(false);

  const getMenuItems = useCallback(() => {
    return [
      isFilterActive ? (
        <EuiContextMenuItem
          data-test-subj="dscGridShowAllDocuments"
          key="showAllDocuments"
          icon="eye"
          onClick={() => {
            setIsSelectionPopoverOpen(false);
            setIsFilterActive(false);
          }}
        >
          {isPlainRecord ? (
            <FormattedMessage
              id="unifiedDataTable.showAllResults"
              defaultMessage="Show all results"
            />
          ) : (
            <FormattedMessage
              id="unifiedDataTable.showAllDocuments"
              defaultMessage="Show all documents"
            />
          )}
        </EuiContextMenuItem>
      ) : (
        <EuiContextMenuItem
          data-test-subj="dscGridShowSelectedDocuments"
          key="showSelectedDocuments"
          icon="eye"
          onClick={() => {
            setIsSelectionPopoverOpen(false);
            setIsFilterActive(true);
          }}
        >
          {isPlainRecord ? (
            <FormattedMessage
              id="unifiedDataTable.showSelectedResultsOnly"
              defaultMessage="Show selected results only"
            />
          ) : (
            <FormattedMessage
              id="unifiedDataTable.showSelectedDocumentsOnly"
              defaultMessage="Show selected documents only"
            />
          )}
        </EuiContextMenuItem>
      ),
      <EuiCopy
        key="copyJsonWrapper"
        data-test-subj="dscGridCopySelectedDocumentsJSON"
        textToCopy={
          rows
            ? JSON.stringify(
                rows.filter((row) => selectedDocs.includes(row.id)).map((row) => row.raw)
              )
            : ''
        }
      >
        {(copy) => (
          <EuiContextMenuItem key="copyJSON" icon="copyClipboard" onClick={copy}>
            {isPlainRecord ? (
              <FormattedMessage
                id="unifiedDataTable.copyResultsToClipboardJSON"
                defaultMessage="Copy results to clipboard (JSON)"
              />
            ) : (
              <FormattedMessage
                id="unifiedDataTable.copyToClipboardJSON"
                defaultMessage="Copy documents to clipboard (JSON)"
              />
            )}
          </EuiContextMenuItem>
        )}
      </EuiCopy>,
      <EuiContextMenuItem
        data-test-subj="dscGridClearSelectedDocuments"
        key="clearSelection"
        icon="cross"
        onClick={() => {
          setIsSelectionPopoverOpen(false);
          setSelectedDocs([]);
          setIsFilterActive(false);
        }}
      >
        <FormattedMessage id="unifiedDataTable.clearSelection" defaultMessage="Clear selection" />
      </EuiContextMenuItem>,
    ];
  }, [isFilterActive, isPlainRecord, rows, selectedDocs, setIsFilterActive, setSelectedDocs]);

  const toggleSelectionToolbar = useCallback(
    () => setIsSelectionPopoverOpen((prevIsOpen) => !prevIsOpen),
    []
  );

  return (
    <EuiPopover
      closePopover={() => setIsSelectionPopoverOpen(false)}
      isOpen={isSelectionPopoverOpen}
      panelPaddingSize="none"
      button={
        <EuiDataGridToolbarControl
          iconType="documents"
          onClick={toggleSelectionToolbar}
          data-selected-documents={selectedDocs.length}
          data-test-subj="unifiedDataTableSelectionBtn"
          isSelected={isFilterActive}
          badgeContent={selectedDocs.length}
        >
          {isPlainRecord ? (
            <FormattedMessage
              id="unifiedDataTable.selectedResultsButtonLabel"
              defaultMessage="Selected"
              description="Selected results"
            />
          ) : (
            <FormattedMessage
              id="unifiedDataTable.selectedRowsButtonLabel"
              defaultMessage="Selected"
              description="Selected documents"
            />
          )}
        </EuiDataGridToolbarControl>
      }
    >
      {isSelectionPopoverOpen && (
        <EuiContextMenuPanel
          items={getMenuItems()}
          data-test-subj="unifiedDataTableSelectionMenu"
        />
      )}
    </EuiPopover>
  );
}

export const DataTableCompareToolbarBtn = ({
  selectedDocs,
  setIsCompareActive,
}: {
  selectedDocs: string[];
  setIsCompareActive: (value: boolean) => void;
}) => {
  return (
    <EuiDataGridToolbarControl
      iconType="diff"
      badgeContent={selectedDocs.length}
      data-test-subj="unifiedDataTableCompareSelectedDocuments"
      onClick={() => {
        setIsCompareActive(true);
      }}
    >
      <FormattedMessage
        id="unifiedDataTable.compareSelectedRowsButtonLabel"
        defaultMessage="Compare"
      />
    </EuiDataGridToolbarControl>
  );
};
