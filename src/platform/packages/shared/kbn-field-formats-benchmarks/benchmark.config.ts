/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { InitialBenchConfig } from '@kbn/bench';

const config: InitialBenchConfig = {
  name: 'field_formatters',
  runs: 5,
  timeout: 5 * 60_000,
  benchmarks: [
    {
      kind: 'module',
      name: 'formatters.react_vs_html',
      description: 'Compare React field formatters vs HTML bridge performance',
      module: require.resolve('./benchmarks/formatters.bench'),
      compare: {
        missing: 'skip',
      },
    },
    {
      kind: 'module',
      name: 'formatters.html_only',
      description: 'Benchmark HTML convert() performance only (for branch comparison)',
      module: require.resolve('./benchmarks/html_only.bench'),
      compare: {
        missing: 'skip',
      },
    },
  ],
};

// eslint-disable-next-line import/no-default-export
export default config;
