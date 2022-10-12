/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { DataViewField } from '@kbn/data-views-plugin/common';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UnifiedFieldListPluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UnifiedFieldListPluginStart {}

export type AddFieldFilterHandler = (
  field: DataViewField | '_exists_',
  value: unknown,
  type: '+' | '-'
) => void;

export enum ExistenceFetchStatus {
  failed = 'failed',
  succeeded = 'succeeded',
  unknown = 'unknown',
}

export enum FieldsGroupNames {
  SpecialFields = 'SpecialFields',
  AvailableFields = 'AvailableFields',
  EmptyFields = 'EmptyFields',
  MetaFields = 'MetaFields',
}

export interface FieldsGroupDetails {
  showInAccordion: boolean;
  isInitiallyOpen: boolean;
  title: string;
  helpText?: string;
  isAffectedByGlobalFilter: boolean;
  isAffectedByTimeFilter: boolean;
  hideDetails?: boolean;
  defaultNoFieldsMessage?: string;
}

export interface FieldsGroup extends FieldsGroupDetails {
  fields: DataViewField[];
  fieldCount: number;
}

export type FieldListGroups = {
  [key in FieldsGroupNames]?: FieldsGroup;
};
