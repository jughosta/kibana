/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { EuiFieldSearch, type EuiFieldSearchProps } from '@elastic/eui';

export interface FieldNameSearchProps {
  'data-test-subj': string;
  append?: EuiFieldSearchProps['append'];
  nameFilter: string;
  fieldSearchDescriptionId?: string;
  onChange: (nameFilter: string) => unknown;
}

export const FieldNameSearch: React.FC<FieldNameSearchProps> = ({
  'data-test-subj': dataTestSubject,
  append,
  nameFilter,
  fieldSearchDescriptionId,
  onChange,
}) => {
  const searchPlaceholder = i18n.translate('unifiedFieldList.fieldNameSearch.filterByNameLabel', {
    defaultMessage: 'Search field names',
    description: 'Search the list of fields in the data view for the provided text',
  });

  return (
    <EuiFieldSearch
      aria-describedby={fieldSearchDescriptionId}
      aria-label={searchPlaceholder}
      data-test-subj={`${dataTestSubject}FieldSearch`}
      fullWidth
      onChange={(event) => onChange(event.target.value)}
      placeholder={searchPlaceholder}
      value={nameFilter}
      append={append}
    />
  );
};
