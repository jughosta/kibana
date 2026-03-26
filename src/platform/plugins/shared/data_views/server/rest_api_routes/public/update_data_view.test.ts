/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { updateDataView } from './update_data_view';
import { dataViewsService } from '../../mocks';
import { getUsageCollection } from './test_utils';
import { ManagedDataViewError } from '../../../common/errors';
import type { DataViewLazy } from '../../../common';

describe('updateDataView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls usageCollection', async () => {
    const usageCollection = getUsageCollection();
    dataViewsService.getDataViewLazy.mockImplementation(
      async () =>
        ({
          managed: false,
          title: 'kibana*',
        } as unknown as DataViewLazy)
    );

    await updateDataView({
      dataViewsService,
      counterName: 'POST /path',
      usageCollection,
      spec: {
        title: 'kibana*',
      },
      id: 'abc',
      refreshFields: false,
    });
    expect(usageCollection.incrementCounter).toHaveBeenCalledTimes(1);
  });

  it('throws ManagedDataViewError when data view is managed', async () => {
    dataViewsService.getDataViewLazy.mockImplementation(
      async () =>
        ({
          managed: true,
          title: 'managed-pattern*',
        } as unknown as DataViewLazy)
    );

    await expect(
      updateDataView({
        dataViewsService,
        counterName: 'POST /path',
        spec: { title: 'new-title*' },
        id: 'managed-id',
        refreshFields: false,
      })
    ).rejects.toThrow(ManagedDataViewError);

    expect(dataViewsService.updateSavedObject).not.toHaveBeenCalled();
  });

  it('allows update when data view is not managed', async () => {
    const mockDataView = {
      managed: false,
      title: 'old-title*',
    } as unknown as DataViewLazy;
    dataViewsService.getDataViewLazy.mockImplementation(async () => mockDataView);

    await updateDataView({
      dataViewsService,
      counterName: 'POST /path',
      spec: { title: 'new-title*' },
      id: 'regular-id',
      refreshFields: false,
    });

    expect(dataViewsService.updateSavedObject).toHaveBeenCalledWith(mockDataView);
  });
});
