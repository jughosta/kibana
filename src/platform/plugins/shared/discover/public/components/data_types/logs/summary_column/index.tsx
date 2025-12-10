/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import type { SummaryColumnProps } from '@kbn/discover-contextual-components';
import type { CellRenderersExtensionParams } from '../../../../context_awareness';
import { SummaryColumn } from './summary_column';

export type SummaryColumnGetterDeps = CellRenderersExtensionParams;

export const getSummaryColumn = (params: SummaryColumnGetterDeps) => {
  const { actions, density, rowHeight } = params;
  const shouldShowFieldHandler = createGetShouldShowFieldHandler();

  return (props: Omit<SummaryColumnProps, 'core' | 'share'>) => (
    <SummaryColumn
      {...props}
      density={density}
      onFilter={actions.addFilter}
      rowHeight={rowHeight}
      shouldShowFieldHandler={shouldShowFieldHandler}
    />
  );
};

const createGetShouldShowFieldHandler = () => {
  return () => true;
};
