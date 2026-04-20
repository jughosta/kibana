/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import type { Serializable } from '@kbn/utility-types';
import type { BenchmarkRunnable, BenchmarkRunContext } from '@kbn/bench';
import type {
  FieldFormatInstanceType,
  FieldFormatParams,
  FieldFormatsGetConfigFn,
} from '@kbn/field-formats-plugin/common';
import type { FieldFormat } from '@kbn/field-formats-plugin/common';
import { baseFormatters } from '@kbn/field-formats-plugin/common';
import {
  FORMATTER_SAMPLE_DATA,
  ITERATIONS_PER_FORMATTER,
  generateTestValues,
} from './sample_values';

interface BenchmarkMetric {
  value: number;
  title: string;
  format?: 'size' | 'duration' | 'percentage' | 'number';
}

const configDefaults: Record<string, Serializable> = {
  'format:number:defaultPattern': '0,0.[000]',
  'format:bytes:defaultPattern': '0,0.[0]b',
  'format:percent:defaultPattern': '0,0.[000]%',
  'format:currency:defaultPattern': '($0,0.[00])',
  'format:number:defaultLocale': 'en',
  dateFormat: 'MMM D, YYYY @ HH:mm:ss.SSS',
  'dateFormat:tz': 'Browser',
};

const getConfig: FieldFormatsGetConfigFn = (key: string) => {
  return configDefaults[key];
};

function createFormatter(
  FormatterClass: FieldFormatInstanceType,
  params: FieldFormatParams = {}
): FieldFormat {
  return new FormatterClass(params, getConfig);
}

/**
 * Benchmarks cell rendering using convert('html') + dangerouslySetInnerHTML + ReactDOMServer.renderToString().
 * This simulates how UnifiedDataTable rendered cells with the old HTML-based approach.
 */
// eslint-disable-next-line import/no-default-export
export default async function createCellRenderHtmlBenchmark(): Promise<BenchmarkRunnable> {
  return {
    async run(_ctx: BenchmarkRunContext) {
      const metrics: Record<string, number | BenchmarkMetric> = {};

      let totalOps = 0;
      let totalTimeMs = 0;

      for (const sampleData of FORMATTER_SAMPLE_DATA) {
        const FormatterClass = baseFormatters.find((f) => f.id === sampleData.id);

        if (!FormatterClass) {
          continue;
        }

        const formatter = createFormatter(
          FormatterClass,
          (sampleData.params || {}) as FieldFormatParams
        );
        const sampleValues = generateTestValues(ITERATIONS_PER_FORMATTER, sampleData.values);

        // Warm up
        for (const value of sampleData.values) {
          const html = formatter.convert(value, 'html');
          ReactDOMServer.renderToString(
            React.createElement('span', { dangerouslySetInnerHTML: { __html: html } })
          );
        }

        // Benchmark: convert('html') + dangerouslySetInnerHTML + renderToString
        // This simulates the old cell rendering approach
        const start = performance.now();
        for (const value of sampleValues) {
          const html = formatter.convert(value, 'html');
          ReactDOMServer.renderToString(
            React.createElement('span', { dangerouslySetInnerHTML: { __html: html } })
          );
        }
        const timeMs = performance.now() - start;

        totalTimeMs += timeMs;
        totalOps += ITERATIONS_PER_FORMATTER;

        const opsPerSec = Math.round(ITERATIONS_PER_FORMATTER / (timeMs / 1000));

        metrics[`${sampleData.id}_ops_sec`] = {
          value: opsPerSec,
          title: `${sampleData.id} ops/sec`,
          format: 'number',
        };
      }

      // Total metrics
      const totalOpsPerSec = Math.round(totalOps / (totalTimeMs / 1000));

      metrics.total_ops_sec = {
        value: totalOpsPerSec,
        title: 'Total ops/sec',
        format: 'number',
      };
      metrics.total_time_ms = {
        value: Math.round(totalTimeMs),
        title: 'Total time (ms)',
        format: 'duration',
      };

      return { metrics };
    },
  };
}
