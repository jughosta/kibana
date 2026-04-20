/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

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
  type SampleValue,
} from './sample_values';

interface FormatterBenchmarkResult {
  reactTimeMs: number;
  htmlTimeMs: number;
  iterations: number;
}

interface BenchmarkMetric {
  value: number;
  title: string;
  format?: 'size' | 'duration' | 'percentage' | 'number';
}

interface RunResult {
  id: string;
  reactOpsPerSec: number;
  htmlOpsPerSec: number;
  overheadPct: number;
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

function benchmarkFormatter(
  formatter: FieldFormat,
  values: SampleValue[],
  iterations: number
): FormatterBenchmarkResult {
  const testValues = generateTestValues(iterations, values);

  // Warm up - run once to initialize any caches
  for (const value of values) {
    formatter.reactConvert(value);
    formatter.convert(value, 'html');
  }

  // Benchmark React path
  const reactStart = performance.now();
  for (const value of testValues) {
    formatter.reactConvert(value);
  }
  const reactTimeMs = performance.now() - reactStart;

  // Benchmark HTML bridge path
  const htmlStart = performance.now();
  for (const value of testValues) {
    formatter.convert(value, 'html');
  }
  const htmlTimeMs = performance.now() - htmlStart;

  return {
    reactTimeMs,
    htmlTimeMs,
    iterations,
  };
}

function formatOps(ops: number): string {
  if (ops >= 1_000_000) return `${(ops / 1_000_000).toFixed(2)}M`;
  if (ops >= 1_000) return `${(ops / 1_000).toFixed(0)}K`;
  return ops.toFixed(0);
}

function printSummary(results: RunResult[], totalOverheadPct: number): void {
  const sorted = [...results].sort((a, b) => b.overheadPct - a.overheadPct);

  const reactWins = sorted.filter((r) => r.overheadPct > 5);
  const htmlWins = sorted.filter((r) => r.overheadPct < -5);
  const similar = sorted.filter((r) => r.overheadPct >= -5 && r.overheadPct <= 5);

  /* eslint-disable no-console */
  console.log('\n' + '='.repeat(70));
  console.log('FIELD FORMATTERS BENCHMARK SUMMARY');
  console.log('='.repeat(70));

  console.log(
    `\nOverall: HTML bridge is ${
      totalOverheadPct > 0 ? 'SLOWER' : 'FASTER'
    } than React by ${Math.abs(totalOverheadPct).toFixed(1)}%\n`
  );

  if (reactWins.length > 0) {
    console.log('REACT IS FASTER (use reactConvert):');
    console.log('-'.repeat(70));
    for (const r of reactWins) {
      const sign = '+';
      const pct = r.overheadPct.toFixed(0).padStart(3);
      console.log(
        `  ${r.id.padEnd(16)} ${sign}${pct}% overhead | React: ${formatOps(
          r.reactOpsPerSec
        ).padStart(7)} ops/s | HTML: ${formatOps(r.htmlOpsPerSec).padStart(7)} ops/s`
      );
    }
  }

  if (htmlWins.length > 0) {
    console.log('\nHTML IS FASTER (text-only formatters):');
    console.log('-'.repeat(70));
    for (const r of htmlWins) {
      const pct = Math.abs(r.overheadPct).toFixed(0).padStart(3);
      console.log(
        `  ${r.id.padEnd(16)} -${pct}% faster    | React: ${formatOps(r.reactOpsPerSec).padStart(
          7
        )} ops/s | HTML: ${formatOps(r.htmlOpsPerSec).padStart(7)} ops/s`
      );
    }
  }

  if (similar.length > 0) {
    console.log('\nSIMILAR PERFORMANCE (<5% difference):');
    console.log('-'.repeat(70));
    for (const r of similar) {
      const pct = r.overheadPct.toFixed(1).padStart(5);
      console.log(
        `  ${r.id.padEnd(16)}  ${pct}%          | React: ${formatOps(r.reactOpsPerSec).padStart(
          7
        )} ops/s | HTML: ${formatOps(r.htmlOpsPerSec).padStart(7)} ops/s`
      );
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
  /* eslint-enable no-console */
}

// Accumulate results across runs for final summary
const allRunResults: RunResult[][] = [];
let totalOverheadPcts: number[] = [];

// eslint-disable-next-line import/no-default-export
export default async function createFormattersBenchmark(): Promise<BenchmarkRunnable> {
  return {
    async beforeAll() {
      // Reset accumulators
      allRunResults.length = 0;
      totalOverheadPcts = [];
    },

    async run(_ctx: BenchmarkRunContext) {
      const metrics: Record<string, number | BenchmarkMetric> = {};
      const runResults: RunResult[] = [];

      let totalReactTimeMs = 0;
      let totalHtmlTimeMs = 0;
      let totalIterations = 0;

      for (const sampleData of FORMATTER_SAMPLE_DATA) {
        const FormatterClass = baseFormatters.find((f) => f.id === sampleData.id);

        if (!FormatterClass) {
          continue;
        }

        const formatter = createFormatter(
          FormatterClass,
          (sampleData.params || {}) as FieldFormatParams
        );
        const result = benchmarkFormatter(formatter, sampleData.values, ITERATIONS_PER_FORMATTER);

        totalReactTimeMs += result.reactTimeMs;
        totalHtmlTimeMs += result.htmlTimeMs;
        totalIterations += result.iterations;

        const reactOpsPerSec = Math.round(result.iterations / (result.reactTimeMs / 1000));
        const htmlOpsPerSec = Math.round(result.iterations / (result.htmlTimeMs / 1000));
        const overheadPct = ((result.htmlTimeMs - result.reactTimeMs) / result.reactTimeMs) * 100;

        runResults.push({
          id: sampleData.id,
          reactOpsPerSec,
          htmlOpsPerSec,
          overheadPct,
        });

        metrics[`${sampleData.id}_overhead_pct`] = {
          value: Math.round(overheadPct * 100) / 100,
          title: `${sampleData.id} HTML overhead %`,
          format: 'percentage',
        };
      }

      // Calculate totals for this run
      const totalReactOpsPerSec = Math.round(totalIterations / (totalReactTimeMs / 1000));
      const totalHtmlOpsPerSec = Math.round(totalIterations / (totalHtmlTimeMs / 1000));
      const totalOverheadPct = ((totalHtmlTimeMs - totalReactTimeMs) / totalReactTimeMs) * 100;

      // Store for final aggregation
      allRunResults.push(runResults);
      totalOverheadPcts.push(totalOverheadPct);

      // Add summary metrics for @kbn/bench reporting
      metrics.total_react_ops_sec = {
        value: totalReactOpsPerSec,
        title: 'Total React ops/sec',
        format: 'number',
      };
      metrics.total_html_ops_sec = {
        value: totalHtmlOpsPerSec,
        title: 'Total HTML ops/sec',
        format: 'number',
      };
      metrics.total_overhead_pct = {
        value: Math.round(totalOverheadPct * 100) / 100,
        title: 'Total HTML overhead %',
        format: 'percentage',
      };
      metrics.total_iterations = {
        value: totalIterations,
        title: 'Total iterations',
        format: 'number',
      };

      return { metrics };
    },

    async afterAll() {
      if (allRunResults.length === 0) return;

      // Aggregate results across all runs
      const formatterIds = allRunResults[0].map((r) => r.id);
      const aggregated: RunResult[] = formatterIds.map((id) => {
        const runsForFormatter = allRunResults.map((run) => run.find((r) => r.id === id)!);

        const avgReactOps =
          runsForFormatter.reduce((sum, r) => sum + r.reactOpsPerSec, 0) / runsForFormatter.length;
        const avgHtmlOps =
          runsForFormatter.reduce((sum, r) => sum + r.htmlOpsPerSec, 0) / runsForFormatter.length;
        const avgOverhead =
          runsForFormatter.reduce((sum, r) => sum + r.overheadPct, 0) / runsForFormatter.length;

        return {
          id,
          reactOpsPerSec: Math.round(avgReactOps),
          htmlOpsPerSec: Math.round(avgHtmlOps),
          overheadPct: avgOverhead,
        };
      });

      const avgTotalOverhead =
        totalOverheadPcts.reduce((sum, v) => sum + v, 0) / totalOverheadPcts.length;

      // Print single aggregated summary
      printSummary(aggregated, avgTotalOverhead);
    },
  };
}
