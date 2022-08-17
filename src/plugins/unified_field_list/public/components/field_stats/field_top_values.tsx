/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { Fragment } from 'react';
import { euiPaletteColorBlind, EuiSpacer } from '@elastic/eui';
import { DataView, DataViewField } from '@kbn/data-plugin/common';
import type { BucketedAggregation } from '../../../common/types';
import { FieldTopValuesBucket } from './field_top_values_bucket';

export interface FieldTopValuesProps {
  buckets: BucketedAggregation<number | string>['buckets'];
  dataView: DataView;
  field: DataViewField;
  sampledValuesCount: number;
  color?: string;
  testSubject: string;
}

export const FieldTopValues: React.FC<FieldTopValuesProps> = ({
  buckets,
  dataView,
  field,
  sampledValuesCount,
  color = getDefaultColor(),
  testSubject,
}) => {
  if (!buckets?.length) {
    return null;
  }

  const formatter = dataView.getFormatterForField(field);
  const otherCount = getOtherCount(getBucketsValuesCount(buckets), sampledValuesCount);
  const digitsRequired = buckets.some(
    (topValue) => !Number.isInteger(topValue.count / sampledValuesCount)
  );

  return (
    <div data-test-subj={`${testSubject}-topValues`}>
      {buckets.map((topValue, index) => {
        const formatted = formatter.convert(topValue.key);

        return (
          <Fragment key={topValue.key}>
            {index > 0 && <EuiSpacer size="s" />}
            <FieldTopValuesBucket
              formattedLabel={formatted}
              formattedValue={getFormattedPercentageValue(
                topValue.count,
                sampledValuesCount,
                digitsRequired
              )}
              progressValue={getProgressValue(topValue.count, sampledValuesCount)}
              color={color}
              testSubject={testSubject}
            />
          </Fragment>
        );
      })}
      {otherCount > 0 && (
        <>
          <EuiSpacer size="s" />
          <FieldTopValuesBucket
            type="other"
            formattedValue={getFormattedPercentageValue(
              otherCount,
              sampledValuesCount,
              digitsRequired
            )}
            progressValue={getProgressValue(otherCount, sampledValuesCount)}
            color={color}
            testSubject={testSubject}
          />
        </>
      )}
    </div>
  );
};

export const getDefaultColor = () => euiPaletteColorBlind()[1];

export const getFormattedPercentageValue = (
  currentValue: number,
  totalCount: number,
  digitsRequired: boolean
): string => {
  return totalCount > 0
    ? `${(Math.round((currentValue / totalCount) * 1000) / 10).toFixed(digitsRequired ? 1 : 0)}%`
    : '';
};

export const getProgressValue = (currentValue: number, totalCount: number): number => {
  return totalCount > 0 ? currentValue / totalCount : 0;
};

export const getBucketsValuesCount = (
  buckets?: BucketedAggregation<number | string>['buckets']
): number => {
  return buckets?.reduce((prev, bucket) => bucket.count + prev, 0) || 0;
};

export const getOtherCount = (bucketsValuesCount: number, sampledValuesCount: number): number => {
  return sampledValuesCount && bucketsValuesCount ? sampledValuesCount - bucketsValuesCount : 0;
};
