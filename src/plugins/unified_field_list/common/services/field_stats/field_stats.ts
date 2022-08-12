/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { lastValueFrom } from 'rxjs';
import type { DataView } from '@kbn/data-views-plugin/common';
import type { DataPublicPluginStart } from '@kbn/data-plugin/public';
import type { DataViewFieldBase } from '@kbn/es-query';
import type { FieldStatsResponse } from '../../types';
import { fetchAndCalculateFieldStats, SearchHandler, buildSearchParams } from './field_stats_utils';

interface FetchFieldStatsParams {
  data: DataPublicPluginStart;
  dataView: DataView;
  field: DataViewFieldBase;
  fromDate: string;
  toDate: string;
  dslQuery: object;
  size?: number;
  abortController?: AbortController;
}

export const loadFieldStats = async ({
  data,
  dataView,
  field,
  fromDate,
  toDate,
  dslQuery,
  size,
  abortController,
}: FetchFieldStatsParams): Promise<FieldStatsResponse<string | number>> => {
  try {
    if (!dataView?.id || !field?.type) {
      return {};
    }

    const searchHandler: SearchHandler = async (aggs) => {
      const result = await lastValueFrom(
        data.search.search(
          {
            params: buildSearchParams({
              dataViewPattern: dataView.title,
              timeFieldName: dataView.timeFieldName,
              fromDate,
              toDate,
              dslQuery,
              runtimeMappings: dataView.getRuntimeMappings(),
              aggs,
            }),
          },
          {
            abortSignal: abortController?.signal,
          }
        )
      );
      return result.rawResponse;
    };

    return await fetchAndCalculateFieldStats({
      searchHandler,
      field,
      fromDate,
      toDate,
      size,
    });
  } catch (error) {
    // console.error(error);
    throw new Error('Could not provide field stats');
  }
};
