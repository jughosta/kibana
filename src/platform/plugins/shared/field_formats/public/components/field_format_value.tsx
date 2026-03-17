/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import type { IFieldFormat, HtmlContextTypeOptions } from '../../common';

interface Props {
  value: unknown;
  formatter: IFieldFormat;
  options?: HtmlContextTypeOptions;
  className?: string;
}

/**
 * Renders a formatted field value securely.
 * - If the formatter implements `reactConvert`, the result is rendered natively (no dangerouslySetInnerHTML).
 * - Otherwise falls back to the legacy HTML string path (dangerouslySetInnerHTML) until the formatter is migrated.
 *
 * Prefer using this component over calling `formatter.convert(value, 'html')` directly.
 *
 * @public
 */
export const FieldFormatValue: React.FC<Props> = ({ value, formatter, options, className }) => {
  if (formatter.reactConvert) {
    return <span className={className}>{formatter.reactConvert(value, options)}</span>;
  }

  // Legacy fallback: formatter hasn't been migrated to reactConvert yet
  const html = formatter.convert(value, 'html', options);
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }} // eslint-disable-line react/no-danger
    />
  );
};
