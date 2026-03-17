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
 * Renders a formatted field value securely without dangerouslySetInnerHTML.
 *
 * Prefer using this component over calling `formatter.convert(value, 'html')` directly.
 *
 * @public
 */
export const FieldFormatValue: React.FC<Props> = ({ value, formatter, options, className }) => {
  return <span className={className}>{formatter.reactConvert(value, options)}</span>;
};
