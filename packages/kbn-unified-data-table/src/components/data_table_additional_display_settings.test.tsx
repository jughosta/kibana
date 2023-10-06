/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { mountWithIntl } from '@kbn/test-jest-helpers';
import { act } from 'react-dom/test-utils';
import { findTestSubject } from '@elastic/eui/lib/test';
import {
  UnifiedDataTableAdditionalDisplaySettings,
  MAX_ALLOWED_SAMPLE_SIZE,
} from './data_table_additional_display_settings';
import lodash from 'lodash';

jest.spyOn(lodash, 'debounce').mockImplementation((fn: any) => fn);

describe('UnifiedDataTableAdditionalDisplaySettings', function () {
  describe('sampleSize', function () {
    it('should work correctly', async () => {
      const onChangeSampleSizeMock = jest.fn();

      const component = mountWithIntl(
        <UnifiedDataTableAdditionalDisplaySettings
          sampleSize={10}
          onChangeSampleSize={onChangeSampleSizeMock}
        />
      );
      const input = findTestSubject(component, 'unifiedDataTableSampleSizeRange');
      expect(input.exists()).toBe(true);
      expect(input.prop('value')).toBe(10);

      await act(async () => {
        input.simulate('change', {
          target: {
            value: 100,
          },
        });
      });

      expect(onChangeSampleSizeMock).toHaveBeenCalledWith(100);

      await new Promise((resolve) => setTimeout(resolve, 0));
      component.update();

      expect(findTestSubject(component, 'unifiedDataTableSampleSizeRange').prop('value')).toBe(100);
    });

    it('should not execute the callback for an invalid input', async () => {
      const invalidValue = MAX_ALLOWED_SAMPLE_SIZE + 1;
      const onChangeSampleSizeMock = jest.fn();

      const component = mountWithIntl(
        <UnifiedDataTableAdditionalDisplaySettings
          sampleSize={5}
          onChangeSampleSize={onChangeSampleSizeMock}
        />
      );
      const input = findTestSubject(component, 'unifiedDataTableSampleSizeRange');
      expect(input.prop('value')).toBe(5);

      await act(async () => {
        input.simulate('change', {
          target: {
            value: invalidValue,
          },
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
      component.update();

      expect(findTestSubject(component, 'unifiedDataTableSampleSizeRange').prop('value')).toBe(
        invalidValue
      );

      expect(onChangeSampleSizeMock).not.toHaveBeenCalled();
    });

    it('should render value changes correctly', async () => {
      const onChangeSampleSizeMock = jest.fn();

      const component = mountWithIntl(
        <UnifiedDataTableAdditionalDisplaySettings
          sampleSize={200}
          onChangeSampleSize={onChangeSampleSizeMock}
        />
      );

      expect(findTestSubject(component, 'unifiedDataTableSampleSizeRange').prop('value')).toBe(200);

      component.setProps({
        sampleSize: 500,
        onChangeSampleSize: onChangeSampleSizeMock,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
      component.update();

      expect(findTestSubject(component, 'unifiedDataTableSampleSizeRange').prop('value')).toBe(500);

      expect(onChangeSampleSizeMock).not.toHaveBeenCalled();
    });
  });
});
