/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { FIELD_FORMAT_IDS } from '@kbn/field-formats-plugin/common';

export type SampleValue = unknown;

interface FormatterSampleData {
  id: string;
  values: SampleValue[];
  params?: Record<string, unknown>;
}

export const ITERATIONS_PER_FORMATTER = 10000;

export const FORMATTER_SAMPLE_DATA: FormatterSampleData[] = [
  {
    id: FIELD_FORMAT_IDS.BOOLEAN,
    values: [true, false, 'yes', 'no', 'true', 'false', 1, 0, null, undefined],
  },
  {
    id: FIELD_FORMAT_IDS.BYTES,
    values: [0, 1024, 1048576, 1073741824, 1.5, 0.001, null, undefined, NaN, Infinity, -Infinity],
  },
  {
    id: FIELD_FORMAT_IDS.COLOR,
    values: ['error', 'warning', 'success', 'info', 50, 100, 200, true, false, null],
    params: {
      fieldType: 'string',
      colors: [
        { regex: 'error', text: '#fff', background: '#ff0000' },
        { regex: 'warning', text: '#000', background: '#ffff00' },
        { regex: 'success', text: '#fff', background: '#00ff00' },
      ],
    },
  },
  {
    id: FIELD_FORMAT_IDS.CURRENCY,
    values: [0, 1, 100, 1000, 10000, 99.99, 1234.56, -50, null, undefined],
  },
  {
    id: FIELD_FORMAT_IDS.DURATION,
    values: [0, 1000, 60000, 3600000, 86400000, 500, 1500, null, undefined],
    params: {
      inputFormat: 'milliseconds',
      outputFormat: 'humanizePrecise',
      outputPrecision: 2,
    },
  },
  {
    id: FIELD_FORMAT_IDS.GEO_POINT,
    values: [
      { lat: 40.7128, lon: -74.006 },
      { lat: 51.5074, lon: -0.1278 },
      { lat: 35.6762, lon: 139.6503 },
      '40.7128,-74.0060',
      [40.7128, -74.006],
      null,
      undefined,
    ],
  },
  {
    id: FIELD_FORMAT_IDS.HISTOGRAM,
    values: [
      { values: [1, 2, 3], counts: [10, 20, 30] },
      { values: [0.5, 1.5, 2.5], counts: [5, 15, 25] },
      null,
      undefined,
    ],
  },
  {
    id: FIELD_FORMAT_IDS.IP,
    values: [
      2130706433, // 127.0.0.1
      3232235777, // 192.168.1.1
      167772161, // 10.0.0.1
      0,
      4294967295, // 255.255.255.255
      '192.168.1.1',
      null,
      undefined,
    ],
  },
  {
    id: FIELD_FORMAT_IDS.NUMBER,
    values: [0, 1, -1, 100, 1000, 1000000, 0.5, 0.123456789, NaN, Infinity, -Infinity, null],
  },
  {
    id: FIELD_FORMAT_IDS.PERCENT,
    values: [0, 0.5, 1, 0.01, 0.999, 1.5, -0.25, null, undefined],
  },
  {
    id: FIELD_FORMAT_IDS.RELATIVE_DATE,
    values: [
      Date.now(),
      Date.now() - 60000,
      Date.now() - 3600000,
      Date.now() - 86400000,
      Date.now() + 86400000,
      null,
      undefined,
    ],
  },
  {
    id: FIELD_FORMAT_IDS.STATIC_LOOKUP,
    values: ['key1', 'key2', 'key3', 'unknown', '', null, undefined],
    params: {
      lookupEntries: [
        { key: 'key1', value: 'Value One' },
        { key: 'key2', value: 'Value Two' },
        { key: 'key3', value: 'Value Three' },
      ],
      unknownKeyValue: 'Unknown',
    },
  },
  {
    id: FIELD_FORMAT_IDS.STRING,
    values: [
      'hello world',
      'UPPERCASE',
      'MixedCase',
      'foo.bar.baz.qux',
      'SGVsbG8gV29ybGQ=', // base64
      'hello%20world', // url encoded
      '',
      null,
      undefined,
    ],
  },
  {
    id: FIELD_FORMAT_IDS.TRUNCATE,
    values: [
      'short',
      'this is a much longer string that will be truncated',
      'a'.repeat(100),
      'a'.repeat(500),
      '',
      null,
      undefined,
    ],
    params: {
      fieldLength: 20,
    },
  },
  {
    id: FIELD_FORMAT_IDS.URL,
    values: [
      'https://example.com',
      'https://elastic.co/guide/en/kibana',
      'http://localhost:5601/app/discover',
      '#/discover',
      '../app/kibana',
      '/app/kibana',
      '',
      null,
      undefined,
    ],
    params: {
      urlTemplate: '{{rawValue}}',
      labelTemplate: '{{value}}',
    },
  },
];

export function generateTestValues(count: number, baseValues: SampleValue[]): SampleValue[] {
  const result: SampleValue[] = [];
  for (let i = 0; i < count; i++) {
    result.push(baseValues[i % baseValues.length]);
  }
  return result;
}
