/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { DataView } from '@kbn/data-views-plugin/common';
import type { EsHitRecord } from '../types';
import { DataTableRecord } from '../data_types/data_table_record';

/**
 * Build a record for data table, explorer + classic one
 * @param doc the document returned from Elasticsearch
 * @param dataView this current data view
 * @param isAnchor determines if the given doc is the anchor doc when viewing surrounding documents
 */
export function buildDataTableRecord(
  doc: EsHitRecord,
  dataView?: DataView,
  isAnchor?: boolean
): DataTableRecord {
  return new DataTableRecord({ raw: doc, isAnchor, dataView, lazy: true });
}

/**
 * Helper to build multiple DataTableRecords at once, saved a bit of testing code lines
 * @param docs Array of documents returned from Elasticsearch
 * @param dataView this current data view
 */
export function buildDataTableRecordList(
  docs: EsHitRecord[],
  dataView?: DataView
): DataTableRecord[] {
  // const startTime = window.performance.now();
  const result = docs.map((doc) => buildDataTableRecord(doc, dataView));
  // console.log('duration', window.performance.now() - startTime);
  return result;
}
