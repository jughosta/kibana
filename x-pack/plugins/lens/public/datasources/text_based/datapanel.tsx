/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiFormControlLayout, htmlIdGenerator } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import usePrevious from 'react-use/lib/usePrevious';
import { isEqual } from 'lodash';
import { DataPublicPluginStart } from '@kbn/data-plugin/public';
import type { DataViewsPublicPluginStart } from '@kbn/data-views-plugin/public';

import { isOfAggregateQueryType } from '@kbn/es-query';
import { DatatableColumn, ExpressionsStart } from '@kbn/expressions-plugin/public';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import {
  FieldListGrouped,
  FieldListGroupedProps,
  FieldsGroupNames,
  useGroupedFields,
} from '@kbn/unified-field-list-plugin/public';
import { FieldButton } from '@kbn/react-field';
import type { DataViewField } from '@kbn/data-views-plugin/public';
import type { DatasourceDataPanelProps } from '../../types';
import type { TextBasedPrivateState } from './types';
import { getStateFromAggregateQuery } from './utils';
import { ChildDragDropProvider, DragDrop } from '../../drag_drop';
import { DataType, IndexPatternField } from '../../types';
import { LensFieldIcon } from '../../shared_components';

export type TextBasedDataPanelProps = DatasourceDataPanelProps<TextBasedPrivateState> & {
  data: DataPublicPluginStart;
  expressions: ExpressionsStart;
  dataViews: DataViewsPublicPluginStart;
  layerFields?: string[];
};
const htmlId = htmlIdGenerator('datapanel-text-based-languages');
const fieldSearchDescriptionId = htmlId();

export function TextBasedDataPanel({
  setState,
  state,
  dragDropContext,
  core,
  data,
  query,
  filters,
  dateRange,
  expressions,
  dataViews,
  layerFields,
}: TextBasedDataPanelProps) {
  const prevQuery = usePrevious(query);
  const [localState, setLocalState] = useState({ nameFilter: '' });
  const [dataHasLoaded, setDataHasLoaded] = useState(false);
  const clearLocalState = () => setLocalState((s) => ({ ...s, nameFilter: '' }));
  useEffect(() => {
    async function fetchData() {
      if (query && isOfAggregateQueryType(query) && !isEqual(query, prevQuery)) {
        const stateFromQuery = await getStateFromAggregateQuery(
          state,
          query,
          dataViews,
          data,
          expressions
        );

        setDataHasLoaded(true);
        setState(stateFromQuery);
      }
    }
    fetchData();
  }, [data, dataViews, expressions, prevQuery, query, setState, state]);

  const { fieldList } = state;

  const onSelectedFieldFilter = useCallback(
    (field: IndexPatternField | DataViewField): boolean => {
      return Boolean(layerFields?.includes(field.name));
    },
    [layerFields]
  );

  const onFilterField = useCallback(
    (field: IndexPatternField | DataViewField) => {
      if (
        localState.nameFilter &&
        !field.name.toLowerCase().includes(localState.nameFilter.toLowerCase())
      ) {
        return false;
      }
      return true;
    },
    [localState]
  );

  const onOverrideFieldGroupDetails = useCallback((groupName) => {
    if (groupName === FieldsGroupNames.AvailableFields) {
      return {
        helpText: i18n.translate('xpack.lens.indexPattern.allFieldsForTextBasedLabelHelp', {
          defaultMessage:
            'Drag and drop available fields to the workspace and create visualizations. To change the available fields, edit your query.',
        }),
      };
    }
    if (groupName === FieldsGroupNames.EmptyFields || groupName === FieldsGroupNames.MetaFields) {
      return {
        hideIfEmpty: true,
      };
    }
  }, []);

  const { fieldGroups } = useGroupedFields({
    dataViewId: null,
    allFields: fieldList as unknown as DataViewField[],
    services: {
      dataViews,
    },
    onFilterField,
    onSelectedFieldFilter,
    onOverrideFieldGroupDetails,
  });

  const renderFieldItem: FieldListGroupedProps['renderFieldItem'] = useCallback(
    ({ field, itemIndex, groupIndex, hideDetails }) => {
      const lensField = field as unknown as DatatableColumn;
      return (
        <DragDrop
          draggable
          order={[itemIndex]}
          value={{
            field: lensField?.name,
            id: lensField.id,
            humanData: { label: lensField?.name },
          }}
          dataTestSubj={`lnsFieldListPanelField-${lensField.name}`}
        >
          <FieldButton
            className={`lnsFieldItem lnsFieldItem--${lensField?.meta?.type}`}
            isActive={false}
            onClick={() => {}}
            fieldIcon={<LensFieldIcon type={lensField?.meta.type as DataType} />}
            fieldName={field?.name}
          />
        </DragDrop>
      );
    },
    []
  );

  return (
    <KibanaContextProvider
      services={{
        ...core,
      }}
    >
      <ChildDragDropProvider {...dragDropContext}>
        <EuiFlexGroup
          gutterSize="none"
          className="lnsInnerIndexPatternDataPanel"
          direction="column"
          responsive={false}
        >
          <EuiFlexItem grow={false}>
            <EuiFormControlLayout
              icon="search"
              fullWidth
              clear={{
                title: i18n.translate('xpack.lens.indexPatterns.clearFiltersLabel', {
                  defaultMessage: 'Clear name and type filters',
                }),
                'aria-label': i18n.translate('xpack.lens.indexPatterns.clearFiltersLabel', {
                  defaultMessage: 'Clear name and type filters',
                }),
                onClick: () => {
                  clearLocalState();
                },
              }}
            >
              <input
                className="euiFieldText euiFieldText--fullWidth lnsInnerIndexPatternDataPanel__textField"
                data-test-subj="lnsTextBasedLanguagesFieldSearch"
                placeholder={i18n.translate('xpack.lens.indexPatterns.filterByNameLabel', {
                  defaultMessage: 'Search field names',
                  description: 'Search the list of fields in the data view for the provided text',
                })}
                value={localState.nameFilter}
                onChange={(e) => {
                  setLocalState({ ...localState, nameFilter: e.target.value });
                }}
                aria-label={i18n.translate('xpack.lens.indexPatterns.filterByNameLabel', {
                  defaultMessage: 'Search field names',
                  description: 'Search the list of fields in the data view for the provided text',
                })}
                aria-describedby={fieldSearchDescriptionId}
              />
            </EuiFormControlLayout>
          </EuiFlexItem>
          <EuiFlexItem>
            <FieldListGrouped
              fieldGroups={fieldGroups}
              hasSyncedExistingFields={dataHasLoaded}
              existenceFetchFailed={false}
              existenceFetchTimeout={false}
              existFieldsInIndex={!!fieldList.length}
              renderFieldItem={renderFieldItem}
              screenReaderDescriptionForSearchInputId={fieldSearchDescriptionId}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </ChildDragDropProvider>
    </KibanaContextProvider>
  );
}
