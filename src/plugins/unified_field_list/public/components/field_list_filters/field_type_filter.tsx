/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFilterButton,
  EuiIcon,
  EuiLoadingSpinner,
  EuiPopover,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { type DataViewField } from '@kbn/data-views-plugin/common';
import { FieldIcon } from '../field_icon';
import {
  getFieldIconType,
  getFieldTypeName,
  isKnownFieldType,
  KNOWN_FIELD_TYPE_LIST,
} from '../../utils/field_types';
import type { FieldListItem, FieldTypeKnown, GetCustomFieldType } from '../../types';

export interface FieldTypeFilterProps<T extends FieldListItem> {
  allFields: T[] | null;
  getCustomFieldType?: GetCustomFieldType<T>;
  selectedFieldTypes: FieldTypeKnown[];
  onSupportedFieldFilter?: (field: T) => boolean;
  onChange: (fieldTypes: FieldTypeKnown[]) => unknown;
}

// TODO: refactor test-subj and className
// TODO: add icon and type name components

export function FieldTypeFilter<T extends FieldListItem = DataViewField>({
  allFields,
  getCustomFieldType,
  selectedFieldTypes,
  onSupportedFieldFilter,
  onChange,
}: FieldTypeFilterProps<T>) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [typeCounts, setTypeCounts] = useState<Map<string, number>>();

  useEffect(() => {
    // calculate counts only if user opened the popover
    if (!isOpen || !allFields?.length) {
      setTypeCounts(undefined);
      return;
    }
    const counts = new Map();
    allFields.forEach((field) => {
      if (onSupportedFieldFilter && !onSupportedFieldFilter(field)) {
        return;
      }
      const type = getFieldIconType(field, getCustomFieldType);
      if (isKnownFieldType(type)) {
        counts.set(type, (counts.get(type) || 0) + 1);
      }
    });
    setTypeCounts(counts);
  }, [isOpen, allFields, setTypeCounts, getCustomFieldType, onSupportedFieldFilter]);

  const availableFieldTypes = useMemo(() => {
    // sorting is defined by items in KNOWN_FIELD_TYPE_LIST
    return KNOWN_FIELD_TYPE_LIST.filter((type) => {
      const knownTypeCount = typeCounts?.get(type) ?? 0;
      // always include current field type filters - there may not be any fields of the type of an existing type filter on data view switch, but we still need to include the existing filter in the list so that the user can remove it
      return knownTypeCount > 0 || selectedFieldTypes.includes(type);
    });
  }, [typeCounts, selectedFieldTypes]);

  return (
    <EuiPopover
      id="unifiedFieldTypeFilter"
      panelClassName="euiFilterGroup__popoverPanel"
      panelPaddingSize="none"
      anchorPosition="rightUp"
      display="block"
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      button={
        <EuiFilterButton
          aria-label={i18n.translate('unifiedFieldList.fieldTypeFilter.filterByTypeAriaLabel', {
            defaultMessage: 'Filter by type',
          })}
          color="primary"
          isSelected={isOpen}
          numFilters={selectedFieldTypes.length}
          hasActiveFilters={!!selectedFieldTypes.length}
          numActiveFilters={selectedFieldTypes.length}
          data-test-subj="lnsIndexPatternFiltersToggle"
          className="lnsFilterButton"
          onClick={() => setIsOpen((value) => !value)}
        >
          <EuiIcon type="filter" />
        </EuiFilterButton>
      }
    >
      {availableFieldTypes.length > 0 ? (
        <EuiContextMenuPanel
          data-test-subj="lnsIndexPatternTypeFilterOptions"
          items={availableFieldTypes.map((type) => (
            <EuiContextMenuItem
              className="lnsInnerIndexPatternDataPanel__filterType"
              key={type}
              icon={selectedFieldTypes.includes(type) ? 'check' : 'empty'}
              data-test-subj={`typeFilter-${type}`}
              onClick={() => {
                onChange(
                  selectedFieldTypes.includes(type)
                    ? selectedFieldTypes.filter((t) => t !== type)
                    : [...selectedFieldTypes, type]
                );
              }}
            >
              <EuiFlexGroup responsive={false} gutterSize="s">
                <EuiFlexItem grow={false}>
                  <FieldIcon type={type} />
                </EuiFlexItem>
                <EuiFlexItem>{getFieldTypeName(type)}</EuiFlexItem>
              </EuiFlexGroup>
            </EuiContextMenuItem>
          ))}
        />
      ) : (
        <EuiFlexGroup responsive={false} alignItems="center" justifyContent="center">
          <EuiFlexItem grow={false}>
            <EuiSpacer size="l" />
            <EuiLoadingSpinner />
            <EuiSpacer size="l" />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
    </EuiPopover>
  );
}
