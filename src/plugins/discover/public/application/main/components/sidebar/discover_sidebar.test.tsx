/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { findTestSubject } from '@elastic/eui/lib/test';
import { Action } from '@kbn/ui-actions-plugin/public';
import { getDataTableRecords } from '../../../../__fixtures__/real_hits';
import { mountWithIntl } from '@kbn/test-jest-helpers';
import React from 'react';
import {
  DiscoverSidebarComponent as DiscoverSidebar,
  DiscoverSidebarProps,
} from './discover_sidebar';
import { DataViewListItem } from '@kbn/data-views-plugin/public';

import { getDefaultFieldFilter } from './lib/field_filter';
import { createDiscoverServicesMock } from '../../../../__mocks__/services';
import { stubLogstashDataView } from '@kbn/data-plugin/common/stubs';
import { VIEW_MODE } from '../../../../components/view_mode_toggle';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { BehaviorSubject } from 'rxjs';
import { FetchStatus } from '../../../types';
import { AvailableFields$, DataDocuments$ } from '../../hooks/use_saved_search';
import { getDiscoverStateMock } from '../../../../__mocks__/discover_state.mock';
import { DiscoverAppStateProvider } from '../../services/discover_app_state_container';
import * as ExistingFieldsHookApi from '@kbn/unified-field-list-plugin/public/hooks/use_existing_fields';
import { ExistenceFetchStatus } from '@kbn/unified-field-list-plugin/public';

const mockGetActions = jest.fn<Promise<Array<Action<object>>>, [string, { fieldName: string }]>(
  () => Promise.resolve([])
);

jest.spyOn(ExistingFieldsHookApi, 'useExistingFieldsReader');

jest.mock('../../../../kibana_services', () => ({
  getUiActions: () => ({
    getTriggerCompatibleActions: mockGetActions,
  }),
}));

function getCompProps(): DiscoverSidebarProps {
  const dataView = stubLogstashDataView;
  dataView.toSpec = jest.fn(() => ({}));
  const hits = getDataTableRecords(dataView);

  const dataViewList = [
    { id: '0', title: 'b', isPersisted: () => true } as DataViewListItem,
    { id: '1', title: 'a', isPersisted: () => true } as DataViewListItem,
    { id: '2', title: 'c', isPersisted: () => true } as DataViewListItem,
  ];

  const fieldCounts: Record<string, number> = {};

  for (const hit of hits) {
    for (const key of Object.keys(hit.flattened)) {
      fieldCounts[key] = (fieldCounts[key] || 0) + 1;
    }
  }

  (ExistingFieldsHookApi.useExistingFieldsReader as jest.Mock).mockClear();
  (ExistingFieldsHookApi.useExistingFieldsReader as jest.Mock).mockImplementation(() => ({
    hasFieldData: (dataViewId: string, fieldName: string) => {
      return dataViewId === dataView.id && Object.keys(fieldCounts).includes(fieldName);
    },
    getFieldsExistenceStatus: (dataViewId: string) => {
      return dataViewId === dataView.id
        ? ExistenceFetchStatus.succeeded
        : ExistenceFetchStatus.unknown;
    },
    isFieldsExistenceInfoUnavailable: (dataViewId: string) => dataViewId !== dataView.id,
  }));

  const availableFields$ = new BehaviorSubject({
    fetchStatus: FetchStatus.COMPLETE,
    fields: [] as string[],
  }) as AvailableFields$;

  const documents$ = new BehaviorSubject({
    fetchStatus: FetchStatus.COMPLETE,
    result: hits,
  }) as DataDocuments$;

  return {
    columns: ['extension'],
    fieldCounts,
    dataViewList,
    onChangeDataView: jest.fn(),
    onAddFilter: jest.fn(),
    onAddField: jest.fn(),
    onRemoveField: jest.fn(),
    selectedDataView: dataView,
    trackUiMetric: jest.fn(),
    fieldFilter: getDefaultFieldFilter(),
    setFieldFilter: jest.fn(),
    onFieldEdited: jest.fn(),
    editField: jest.fn(),
    viewMode: VIEW_MODE.DOCUMENT_LEVEL,
    createNewDataView: jest.fn(),
    onDataViewCreated: jest.fn(),
    documents$,
    documents: hits,
    availableFields$,
    useNewFieldsApi: true,
  };
}

function getAppStateContainer() {
  const appStateContainer = getDiscoverStateMock({ isTimeBased: true }).appStateContainer;
  appStateContainer.set({
    query: { query: '', language: 'lucene' },
    filters: [],
  });
  return appStateContainer;
}

async function mountComponent(
  props: DiscoverSidebarProps
): Promise<ReactWrapper<DiscoverSidebarProps>> {
  let comp: ReactWrapper<DiscoverSidebarProps>;
  const mockedServices = createDiscoverServicesMock();
  mockedServices.data.dataViews.getIdsWithTitle = jest.fn().mockReturnValue(props.dataViewList);
  mockedServices.data.dataViews.get = jest.fn().mockImplementation((id) => {
    return [...props.dataViewList, props.selectedDataView].find((d) => d!.id === id);
  });

  await act(async () => {
    comp = await mountWithIntl(
      <KibanaContextProvider services={mockedServices}>
        <DiscoverAppStateProvider value={getAppStateContainer()}>
          <DiscoverSidebar {...props} />
        </DiscoverAppStateProvider>
      </KibanaContextProvider>
    );
    // wait for lazy modules
    await new Promise((resolve) => setTimeout(resolve, 0));
    await comp.update();
  });

  await comp!.update();

  return comp!;
}

describe('discover sidebar', function () {
  let props: DiscoverSidebarProps;
  let comp: ReactWrapper<DiscoverSidebarProps>;

  beforeEach(async () => {
    props = getCompProps();
    comp = await mountComponent(props);
  });

  it('should have Selected Fields and Available Fields with Popular Fields sections', function () {
    const popularFieldsCount = findTestSubject(comp, 'fieldListGroupedPopularFields-count');
    const selectedFieldsCount = findTestSubject(comp, 'fieldListGroupedSelectedFields-count');
    const availableFieldsCount = findTestSubject(comp, 'fieldListGroupedAvailableFields-count');
    expect(popularFieldsCount.text()).toBe('1');
    expect(availableFieldsCount.text()).toBe('3');
    expect(selectedFieldsCount.text()).toBe('1');
  });
  it('should allow selecting fields', function () {
    const availableFields = findTestSubject(comp, 'fieldListGroupedAvailableFields');
    findTestSubject(availableFields, 'fieldToggle-bytes').simulate('click');
    expect(props.onAddField).toHaveBeenCalledWith('bytes');
  });
  it('should allow deselecting fields', function () {
    const availableFields = findTestSubject(comp, 'fieldListGroupedAvailableFields');
    findTestSubject(availableFields, 'fieldToggle-extension').simulate('click');
    expect(props.onRemoveField).toHaveBeenCalledWith('extension');
  });

  it('should render "Add a field" button', () => {
    const addFieldButton = findTestSubject(comp, 'dataView-add-field_btn');
    expect(addFieldButton.length).toBe(1);
    addFieldButton.simulate('click');
    expect(props.editField).toHaveBeenCalledWith();
  });

  it('should render "Edit field" button', async () => {
    const availableFields = findTestSubject(comp, 'fieldListGroupedAvailableFields');
    findTestSubject(availableFields, 'field-bytes').simulate('click');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await comp.update();
    const editFieldButton = findTestSubject(comp, 'discoverFieldListPanelEdit-bytes');
    expect(editFieldButton.length).toBe(1);
    editFieldButton.simulate('click');
    expect(props.editField).toHaveBeenCalledWith('bytes');
  });

  it('should not render Add/Edit field buttons in viewer mode', async () => {
    const compInViewerMode = await mountComponent({
      ...getCompProps(),
      editField: undefined,
    });
    const addFieldButton = findTestSubject(compInViewerMode, 'dataView-add-field_btn');
    expect(addFieldButton.length).toBe(0);
    const availableFields = findTestSubject(comp, 'fieldListGroupedAvailableFields');
    findTestSubject(availableFields, 'field-bytes').simulate('click');
    const editFieldButton = findTestSubject(compInViewerMode, 'discoverFieldListPanelEdit-bytes');
    expect(editFieldButton.length).toBe(0);
  });

  it('should render buttons in data view picker correctly', async () => {
    const compWithPicker = await mountComponent({
      ...getCompProps(),
      showDataViewPicker: true,
    });
    // open data view picker
    findTestSubject(compWithPicker, 'dataView-switch-link').simulate('click');
    expect(findTestSubject(compWithPicker, 'changeDataViewPopover').length).toBe(1);
    // click "Add a field"
    const addFieldButtonInDataViewPicker = findTestSubject(
      compWithPicker,
      'indexPattern-add-field'
    );
    expect(addFieldButtonInDataViewPicker.length).toBe(1);
    addFieldButtonInDataViewPicker.simulate('click');
    expect(props.editField).toHaveBeenCalledWith();
    // click "Create a data view"
    const createDataViewButton = findTestSubject(compWithPicker, 'dataview-create-new');
    expect(createDataViewButton.length).toBe(1);
    createDataViewButton.simulate('click');
    expect(props.createNewDataView).toHaveBeenCalled();
  });

  it('should not render buttons in data view picker when in viewer mode', async () => {
    const compWithPickerInViewerMode = await mountComponent({
      ...getCompProps(),
      showDataViewPicker: true,
      editField: undefined,
      createNewDataView: undefined,
    });
    // open data view picker
    findTestSubject(compWithPickerInViewerMode, 'dataView-switch-link').simulate('click');
    expect(findTestSubject(compWithPickerInViewerMode, 'changeDataViewPopover').length).toBe(1);
    // check that buttons are not present
    const addFieldButtonInDataViewPicker = findTestSubject(
      compWithPickerInViewerMode,
      'dataView-add-field'
    );
    expect(addFieldButtonInDataViewPicker.length).toBe(0);
    const createDataViewButton = findTestSubject(compWithPickerInViewerMode, 'dataview-create-new');
    expect(createDataViewButton.length).toBe(0);
  });

  it('should render the Visualize in Lens button in text based languages mode', async () => {
    const compInViewerMode = await mountComponent({
      ...getCompProps(),
      onAddFilter: undefined,
    });
    const visualizeField = findTestSubject(compInViewerMode, 'textBased-visualize');
    expect(visualizeField.length).toBe(1);
  });
});
