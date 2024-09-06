/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { SearchHit } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import type { DatatableColumnMeta } from '@kbn/expressions-plugin/common';

export type { IgnoredReason, ShouldShowFieldInTableHandler } from './utils';

type DiscoverSearchHit = SearchHit<Record<string, unknown>>;

export interface EsHitRecord extends Omit<DiscoverSearchHit, '_index' | '_id' | '_source'> {
  _index?: DiscoverSearchHit['_index'];
  _id?: DiscoverSearchHit['_id'];
  _source?: DiscoverSearchHit['_source'];
}

/**
 * This is the record/row of data provided to our Data Table
 */
export interface DataTableRecord {
  /**
   * A unique id generated by index, id and routing of a record
   */
  id: string;
  /**
   * The document returned by Elasticsearch for search queries
   */
  raw: EsHitRecord;
  /**
   * A flattened version of the ES doc or data provided by SQL, aggregations ...
   */
  flattened: Record<string, unknown>;
  /**
   * Determines that the given doc is the anchor doc when rendering view surrounding docs
   */
  isAnchor?: boolean;
}

type FormattedHitPair = readonly [
  fieldDisplayName: string,
  formattedValue: string,
  fieldName: string | null // `null` is when number of fields is limited and there is an extra pair about it
];

/**
 * If empty, types will be derived by default from the dataView field types.
 * For displaying ES|QL search results, define column types (which are available separately in the fetch request) in the following format.
 */
export type DataTableColumnsMeta = Record<
  string,
  {
    type: DatatableColumnMeta['type'];
    esType?: DatatableColumnMeta['esType'];
  }
>;

/**
 * Pairs array for each field in the hit
 */
export type FormattedHit = FormattedHitPair[];

export interface LogDocumentOverview
  extends LogResourceFields,
    LogStackTraceFields,
    LogCloudFields {
  '@timestamp': string;
  'log.level'?: string;
  message?: string;
  'error.message'?: string;
  'event.original'?: string;
  'trace.id'?: string;
  'log.file.path'?: string;
  'data_stream.namespace': string;
  'data_stream.dataset': string;
}

export interface LogResourceFields {
  'host.name'?: string;
  'service.name'?: string;
  'agent.name'?: string;
  'orchestrator.cluster.name'?: string;
  'orchestrator.cluster.id'?: string;
  'orchestrator.resource.id'?: string;
  'orchestrator.namespace'?: string;
  'container.name'?: string;
  'container.id'?: string;
}

export interface LogStackTraceFields {
  'error.stack_trace'?: string;
  'error.exception.stacktrace'?: string;
  'error.log.stacktrace'?: string;
}

export interface LogCloudFields {
  'cloud.provider'?: string;
  'cloud.region'?: string;
  'cloud.availability_zone'?: string;
  'cloud.project.id'?: string;
  'cloud.instance.id'?: string;
}
