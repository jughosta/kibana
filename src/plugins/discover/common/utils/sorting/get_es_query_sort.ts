/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { EsQuerySortValue, SortDirection } from '@kbn/data-plugin/public';
import type { DataView } from '@kbn/data-views-plugin/common';
import type { IUiSettingsClient } from '@kbn/core-ui-settings-browser';
import { CONTEXT_TIE_BREAKER_FIELDS_SETTING } from '../..';

/**
 * Returns `EsQuerySort` which is used to sort records in the ES query
 * https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-sort.html
 * @param timeField
 * @param tieBreakerField
 * @param sortDir
 * @param isTimeNanosBased
 */
export function getEsQuerySort(
  timeField: string,
  tieBreakerField: string,
  sortDir: SortDirection,
  isTimeNanosBased: boolean
): [EsQuerySortValue, EsQuerySortValue] {
  return [
    getESQuerySortForTimeField(timeField, sortDir, isTimeNanosBased),
    getESQuerySortForTieBreaker(tieBreakerField, sortDir),
  ];
}

export function getESQuerySortForTimeField(
  timeField: string,
  sortDir: SortDirection,
  isTimeNanosBased: boolean
): EsQuerySortValue {
  return {
    [timeField]: {
      order: sortDir,
      ...(isTimeNanosBased
        ? {
            format: 'strict_date_optional_time_nanos',
            numeric_type: 'date_nanos',
          }
        : { format: 'strict_date_optional_time' }),
    },
  };
}

export function getESQuerySortForTieBreaker(
  tieBreakerField: string,
  sortDir: SortDirection
): EsQuerySortValue {
  return { [tieBreakerField]: sortDir };
}

/**
 * The list of field names that are allowed for sorting, but not included in
 * data view fields.
 */
const META_FIELD_NAMES: string[] = ['_seq_no', '_doc', '_uid'];

/**
 * Returns a field from the intersection of the set of sortable fields in the
 * given data view and a given set of candidate field names.
 */
export function getTieBreakerField(dataView: DataView, uiSettings: IUiSettingsClient) {
  const sortableFields = uiSettings
    .get(CONTEXT_TIE_BREAKER_FIELDS_SETTING)
    .filter(
      (fieldName: string) =>
        META_FIELD_NAMES.includes(fieldName) ||
        (dataView.fields.getByName(fieldName) || { sortable: false }).sortable
    );
  return sortableFields[0];
}
