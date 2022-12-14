/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { type DataViewField } from '@kbn/data-views-plugin/common';
import { FieldNameSearch, type FieldNameSearchProps } from './field_name_search';
import { FieldTypeFilter, type FieldTypeFilterProps } from './field_type_filter';
import { type FieldListItem } from '../../types';

export interface FieldListFiltersProps<T extends FieldListItem> {
  docLinks: FieldTypeFilterProps<T>['docLinks'];
  selectedFieldTypes?: FieldTypeFilterProps<T>['selectedFieldTypes'];
  allFields?: FieldTypeFilterProps<T>['allFields'];
  getCustomFieldType?: FieldTypeFilterProps<T>['getCustomFieldType'];
  onSupportedFieldFilter?: FieldTypeFilterProps<T>['onSupportedFieldFilter'];
  onChangeFieldTypes?: FieldTypeFilterProps<T>['onChange'];
  nameFilter: FieldNameSearchProps['nameFilter'];
  fieldSearchDescriptionId?: FieldNameSearchProps['fieldSearchDescriptionId'];
  onChangeNameFilter: FieldNameSearchProps['onChange'];
}

export function FieldListFilters<T extends FieldListItem = DataViewField>({
  docLinks,
  selectedFieldTypes,
  allFields,
  getCustomFieldType,
  onSupportedFieldFilter,
  onChangeFieldTypes,
  nameFilter,
  fieldSearchDescriptionId,
  onChangeNameFilter,
}: FieldListFiltersProps<T>) {
  return (
    <FieldNameSearch
      append={
        allFields && selectedFieldTypes && onChangeFieldTypes ? (
          <FieldTypeFilter
            docLinks={docLinks}
            selectedFieldTypes={selectedFieldTypes}
            allFields={allFields}
            getCustomFieldType={getCustomFieldType}
            onSupportedFieldFilter={onSupportedFieldFilter}
            onChange={onChangeFieldTypes}
          />
        ) : undefined
      }
      nameFilter={nameFilter}
      fieldSearchDescriptionId={fieldSearchDescriptionId}
      onChange={onChangeNameFilter}
    />
  );
}
