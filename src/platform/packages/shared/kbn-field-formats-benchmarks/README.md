# Field Formatters Benchmark

Benchmark tools to measure field formatter performance.

## Background

Kibana's field formatting has two rendering paths:

- **React path**: `formatter.reactConvert(value)` returns a `ReactNode` directly
- **HTML bridge**: `formatter.convert(value, 'html')` uses `ReactDOM.renderToStaticMarkup()` internally to convert React output to an HTML string

The HTML bridge exists for legacy consumers but has overhead from React server-side rendering.

## Available Benchmarks

| Benchmark | Description |
|-----------|-------------|
| `formatters.react_vs_html` | Compares React vs HTML bridge, shows overhead percentage |
| `formatters.html_only` | Measures HTML `convert()` only, useful for branch comparisons |

## Running the Benchmarks

From the Kibana root directory:

```bash
# Run all benchmarks (5 runs by default)
node scripts/bench --config src/platform/packages/shared/kbn-field-formats-benchmarks/benchmark.config.ts

# Run only the React vs HTML comparison
node scripts/bench --config src/platform/packages/shared/kbn-field-formats-benchmarks/benchmark.config.ts --grep react_vs_html

# Run only the HTML-only benchmark
node scripts/bench --config src/platform/packages/shared/kbn-field-formats-benchmarks/benchmark.config.ts --grep html_only
```

### Comparing Branches

Compare HTML rendering performance between two git refs:

```bash
# Compare between two branches (both must have the benchmark files)
node scripts/bench \
  --config src/platform/packages/shared/kbn-field-formats-benchmarks/benchmark.config.ts \
  --grep html_only \
  --left my-baseline-branch \
  --right my-feature-branch
```

This will show a diff report with percentage changes:
- `+5%` = right branch is 5% slower than left
- `-5%` = right branch is 5% faster than left

**Note**: Both branches must have the benchmark files. If comparing against `main` (which doesn't have the benchmarks yet), you can:

1. Cherry-pick or copy the benchmark files to a baseline branch first
2. Or run benchmarks separately on each branch and compare manually:

```bash
# On main branch
git stash
git checkout main
# Copy benchmark files, run, note results
node scripts/bench --config src/platform/packages/shared/kbn-field-formats-benchmarks/benchmark.config.ts --grep html_only

# On feature branch  
git checkout my-feature
node scripts/bench --config src/platform/packages/shared/kbn-field-formats-benchmarks/benchmark.config.ts --grep html_only
```

### CPU Profiling

Generate CPU profiles for deeper analysis:

```bash
node scripts/bench \
  --config src/platform/packages/shared/kbn-field-formats-benchmarks/benchmark.config.ts \
  --profile --open-profile
```

## Output Metrics

For each formatter, the benchmark reports:

| Metric | Description |
|--------|-------------|
| `{formatter}_react_ops_sec` | Operations per second using `reactConvert()` |
| `{formatter}_html_ops_sec` | Operations per second using `convert('html')` |
| `{formatter}_overhead_pct` | Percentage overhead of HTML bridge vs React |

Summary metrics are also provided:

- `total_react_ops_sec` - Aggregate React ops/sec across all formatters
- `total_html_ops_sec` - Aggregate HTML ops/sec across all formatters
- `total_overhead_pct` - Overall HTML bridge overhead percentage
- `total_iterations` - Total number of format operations performed

## Formatters Benchmarked

The benchmark covers all base formatters from `baseFormatters`:

- Boolean
- Bytes
- Color
- Currency
- Duration
- GeoPoint
- Histogram
- IP
- Number
- Percent
- RelativeDate
- StaticLookup
- String
- Truncate
- URL

## Customizing the Benchmark

### Adjusting Iterations

Edit `ITERATIONS_PER_FORMATTER` in `sample_values.ts` to change how many times each formatter is called per run (default: 10,000).

### Adding Sample Values

Edit `FORMATTER_SAMPLE_DATA` in `sample_values.ts` to add or modify test values for specific formatters.

### Changing Number of Runs

Edit `runs` in `benchmark.config.ts` to change how many benchmark runs are performed (default: 5).
