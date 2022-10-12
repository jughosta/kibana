/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { createMockedDragDropContext } from './mocks';
import { dataPluginMock } from '@kbn/data-plugin/public/mocks';
import {
  dataViewPluginMocks,
  Start as DataViewPublicStart,
} from '@kbn/data-views-plugin/public/mocks';
import { IndexPatternDataPanel, InnerIndexPatternDataPanel } from './datapanel';
import { FieldList } from '@kbn/unified-field-list-plugin/public';
import * as UseExistingFieldsApi from '@kbn/unified-field-list-plugin/public/hooks/use_existing_fields';
import * as ExistingFieldsServiceApi from '@kbn/unified-field-list-plugin/public/services/field_existing/load_field_existing';
import { FieldItem } from './field_item';
import { act } from 'react-dom/test-utils';
import { coreMock } from '@kbn/core/public/mocks';
import { IndexPatternPrivateState } from './types';
import { mountWithIntl, shallowWithIntl } from '@kbn/test-jest-helpers';
import { EuiCallOut, EuiLoadingSpinner, EuiProgress } from '@elastic/eui';
import { documentField } from './document_field';
import { chartPluginMock } from '@kbn/charts-plugin/public/mocks';
import { fieldFormatsServiceMock } from '@kbn/field-formats-plugin/public/mocks';
import { indexPatternFieldEditorPluginMock } from '@kbn/data-view-field-editor-plugin/public/mocks';
import { getFieldByNameFactory } from './pure_helpers';
import { uiActionsPluginMock } from '@kbn/ui-actions-plugin/public/mocks';
import { TermsIndexPatternColumn } from './operations';
import { DOCUMENT_FIELD_NAME } from '../../common';
import { createIndexPatternServiceMock } from '../mocks/data_views_service_mock';
import { createMockFramePublicAPI } from '../mocks';
import { DataViewsState } from '../state_management';
import { DataView } from '@kbn/data-views-plugin/public';
import { UI_SETTINGS } from '@kbn/data-plugin/public';
import { ReactWrapper } from 'enzyme';

const fieldsOne = [
  {
    name: 'timestamp',
    displayName: 'timestampLabel',
    type: 'date',
    aggregatable: true,
    searchable: true,
  },
  {
    name: 'bytes',
    displayName: 'bytes',
    type: 'number',
    aggregatable: true,
    searchable: true,
  },
  {
    name: 'memory',
    displayName: 'amemory',
    type: 'number',
    aggregatable: true,
    searchable: true,
  },
  {
    name: 'unsupported',
    displayName: 'unsupported',
    type: 'geo',
    aggregatable: true,
    searchable: true,
  },
  {
    name: 'source',
    displayName: 'source',
    type: 'string',
    aggregatable: true,
    searchable: true,
  },
  {
    name: 'client',
    displayName: 'client',
    type: 'ip',
    aggregatable: true,
    searchable: true,
  },
  documentField,
];

const fieldsTwo = [
  {
    name: 'timestamp',
    displayName: 'timestampLabel',
    type: 'date',
    aggregatable: true,
    searchable: true,
    aggregationRestrictions: {
      date_histogram: {
        agg: 'date_histogram',
        fixed_interval: '1d',
        delay: '7d',
        time_zone: 'UTC',
      },
    },
  },
  {
    name: 'bytes',
    displayName: 'bytes',
    type: 'number',
    aggregatable: true,
    searchable: true,
    aggregationRestrictions: {
      histogram: {
        agg: 'histogram',
        interval: 1000,
      },
      max: {
        agg: 'max',
      },
      min: {
        agg: 'min',
      },
      sum: {
        agg: 'sum',
      },
    },
  },
  {
    name: 'source',
    displayName: 'source',
    type: 'string',
    aggregatable: true,
    searchable: true,
    aggregationRestrictions: {
      terms: {
        agg: 'terms',
      },
    },
  },
  documentField,
];

const fieldsThree = [
  {
    name: 'timestamp',
    displayName: 'timestampLabel',
    type: 'date',
    aggregatable: true,
    searchable: true,
  },
  {
    name: 'bytes',
    displayName: 'bytes',
    type: 'number',
    aggregatable: true,
    searchable: true,
  },
  {
    name: 'source',
    displayName: 'source',
    type: 'string',
    aggregatable: true,
    searchable: true,
  },
  documentField,
];

jest.spyOn(UseExistingFieldsApi, 'useExistingFieldsFetcher');
jest.spyOn(UseExistingFieldsApi, 'useExistingFieldsReader');
jest.spyOn(ExistingFieldsServiceApi, 'loadFieldExisting').mockImplementation(async () => ({
  indexPatternTitle: 'test',
  existingFieldNames: [],
}));

const initialState: IndexPatternPrivateState = {
  currentIndexPatternId: '1',
  layers: {
    first: {
      indexPatternId: '1',
      columnOrder: ['col1', 'col2'],
      columns: {
        col1: {
          label: 'My Op',
          dataType: 'string',
          isBucketed: true,
          operationType: 'terms',
          sourceField: 'source',
          params: {
            size: 5,
            orderDirection: 'asc',
            orderBy: {
              type: 'alphabetical',
            },
          },
        } as TermsIndexPatternColumn,
        col2: {
          label: 'My Op',
          dataType: 'number',
          isBucketed: false,
          operationType: 'average',
          sourceField: 'memory',
        },
      },
    },
    second: {
      indexPatternId: '1',
      columnOrder: ['col1', 'col2'],
      columns: {
        col1: {
          label: 'My Op',
          dataType: 'string',
          isBucketed: true,
          operationType: 'terms',
          sourceField: 'source',
          params: {
            size: 5,
            orderDirection: 'asc',
            orderBy: {
              type: 'alphabetical',
            },
          },
        } as TermsIndexPatternColumn,
        col2: {
          label: 'My Op',
          dataType: 'number',
          isBucketed: false,
          operationType: 'average',
          sourceField: 'bytes',
        },
      },
    },
  },
};

function getFrameAPIMock({ indexPatterns, ...rest }: Partial<DataViewsState> = {}) {
  const frameAPI = createMockFramePublicAPI();
  const defaultIndexPatterns = {
    '1': {
      id: '1',
      title: 'idx1',
      timeFieldName: 'timestamp',
      hasRestrictions: false,
      fields: fieldsOne,
      getFieldByName: getFieldByNameFactory(fieldsOne),
      isPersisted: true,
      spec: {},
    },
    '2': {
      id: '2',
      title: 'idx2',
      timeFieldName: 'timestamp',
      hasRestrictions: true,
      fields: fieldsTwo,
      getFieldByName: getFieldByNameFactory(fieldsTwo),
      isPersisted: true,
      spec: {},
    },
    '3': {
      id: '3',
      title: 'idx3',
      timeFieldName: 'timestamp',
      hasRestrictions: false,
      fields: fieldsThree,
      getFieldByName: getFieldByNameFactory(fieldsThree),
      isPersisted: true,
      spec: {},
    },
  };

  return {
    ...frameAPI,
    dataViews: {
      ...frameAPI.dataViews,
      indexPatterns: indexPatterns ?? defaultIndexPatterns,
      ...rest,
    },
  };
}

const dslQuery = { bool: { must: [], filter: [], should: [], must_not: [] } };

// @ts-expect-error Portal mocks are notoriously difficult to type
ReactDOM.createPortal = jest.fn((element) => element);

describe('IndexPattern Data Panel', () => {
  const indexPatterns = {
    a: {
      id: 'a',
      title: 'aaa',
      timeFieldName: 'atime',
      fields: fieldsOne,
      getFieldByName: getFieldByNameFactory(fieldsOne),
      hasRestrictions: false,
      isPersisted: true,
      spec: {},
    },
    b: {
      id: 'b',
      title: 'bbb',
      timeFieldName: 'btime',
      fields: fieldsTwo,
      getFieldByName: getFieldByNameFactory(fieldsTwo),
      hasRestrictions: false,
      isPersisted: true,
      spec: {},
    },
  };
  let defaultProps: Parameters<typeof InnerIndexPatternDataPanel>[0] & {
    showNoDataPopover: () => void;
  };
  let core: ReturnType<typeof coreMock['createStart']>;
  let dataViews: DataViewPublicStart;

  beforeEach(() => {
    core = coreMock.createStart();
    dataViews = dataViewPluginMocks.createStartContract();
    const frame = getFrameAPIMock();
    defaultProps = {
      data: dataPluginMock.createStartContract(),
      dataViews,
      fieldFormats: fieldFormatsServiceMock.createStartContract(),
      indexPatternFieldEditor: indexPatternFieldEditorPluginMock.createStartContract(),
      onIndexPatternRefresh: jest.fn(),
      dragDropContext: createMockedDragDropContext(),
      currentIndexPatternId: '1',
      core,
      dateRange: {
        fromDate: 'now-7d',
        toDate: 'now',
      },
      charts: chartPluginMock.createSetupContract(),
      query: { query: '', language: 'lucene' },
      filters: [],
      showNoDataPopover: jest.fn(),
      dropOntoWorkspace: jest.fn(),
      hasSuggestionForField: jest.fn(() => false),
      uiActions: uiActionsPluginMock.createStartContract(),
      indexPatternService: createIndexPatternServiceMock({ core, dataViews }),
      frame,
      activeIndexPatterns: [frame.dataViews.indexPatterns['1']],
    };

    (ExistingFieldsServiceApi.loadFieldExisting as jest.Mock).mockClear();
    (UseExistingFieldsApi.useExistingFieldsReader as jest.Mock).mockClear();
    (UseExistingFieldsApi.useExistingFieldsFetcher as jest.Mock).mockClear();
    UseExistingFieldsApi.resetFieldsExistenceCache();
  });

  it('should render a warning if there are no index patterns', () => {
    const wrapper = shallowWithIntl(
      <IndexPatternDataPanel
        {...defaultProps}
        state={{
          ...initialState,
          currentIndexPatternId: '',
        }}
        setState={jest.fn()}
        dragDropContext={{
          ...createMockedDragDropContext(),
          dragging: { id: '1', humanData: { label: 'Label' } },
        }}
        frame={createMockFramePublicAPI()}
      />
    );
    expect(wrapper.find('[data-test-subj="indexPattern-no-indexpatterns"]')).toHaveLength(1);
  });

  describe('loading existence data', () => {
    function testProps({
      currentIndexPatternId,
      otherProps,
    }: {
      currentIndexPatternId: keyof typeof indexPatterns;
      otherProps?: object;
    }) {
      core.uiSettings.get.mockImplementation((key: string) => {
        if (key === UI_SETTINGS.META_FIELDS) {
          return [];
        }
      });
      dataViews.get.mockImplementation(async (id: string) => {
        return [indexPatterns.a, indexPatterns.b].find(
          (indexPattern) => indexPattern.id === id
        ) as unknown as DataView;
      });
      return {
        ...defaultProps,
        indexPatternService: createIndexPatternServiceMock({
          updateIndexPatterns: jest.fn(),
          core,
          dataViews,
        }),
        setState: jest.fn(),
        dragDropContext: {
          ...createMockedDragDropContext(),
          dragging: { id: '1', humanData: { label: 'Label' } },
        },
        dateRange: { fromDate: '2019-01-01', toDate: '2020-01-01' },
        frame: getFrameAPIMock({
          indexPatterns: indexPatterns as unknown as DataViewsState['indexPatterns'],
        }),
        state: {
          currentIndexPatternId,
          layers: {
            1: {
              indexPatternId: currentIndexPatternId,
              columnOrder: [],
              columns: {},
            },
          },
        } as IndexPatternPrivateState,
        ...(otherProps || {}),
      };
    }

    it('loads existence data', async () => {
      const props = testProps({
        currentIndexPatternId: 'a',
      });

      (ExistingFieldsServiceApi.loadFieldExisting as jest.Mock).mockImplementation(async () => {
        return {
          existingFieldNames: [indexPatterns.a.fields[0].name, indexPatterns.a.fields[1].name],
        };
      });

      let inst: ReactWrapper;
      await act(async () => {
        inst = await mountWithIntl(<IndexPatternDataPanel {...props} />);
        inst.update();
      });

      expect(UseExistingFieldsApi.useExistingFieldsFetcher).toHaveBeenCalledWith(
        expect.objectContaining({
          dataViews: [indexPatterns.a],
          query: props.query,
          filters: props.filters,
          fromDate: props.dateRange.fromDate,
          toDate: props.dateRange.toDate,
        })
      );
      expect(UseExistingFieldsApi.useExistingFieldsReader).toHaveBeenCalled();
      expect(
        inst!
          .find('[data-test-subj="unifiedFieldList__fieldListGroupedDescription"]')
          .first()
          .text()
      ).toBe('2 available fields. 3 empty fields. 0 meta fields.');
    });

    it('loads existence data for current index pattern id', async () => {
      const props = testProps({
        currentIndexPatternId: 'b',
      });

      (ExistingFieldsServiceApi.loadFieldExisting as jest.Mock).mockImplementation(async () => {
        return {
          existingFieldNames: [indexPatterns.b.fields[0].name],
        };
      });

      let inst: ReactWrapper;
      await act(async () => {
        inst = await mountWithIntl(<IndexPatternDataPanel {...props} />);
        inst.update();
      });

      expect(UseExistingFieldsApi.useExistingFieldsFetcher).toHaveBeenCalledWith(
        expect.objectContaining({
          dataViews: [indexPatterns.b],
          query: props.query,
          filters: props.filters,
          fromDate: props.dateRange.fromDate,
          toDate: props.dateRange.toDate,
        })
      );
      expect(UseExistingFieldsApi.useExistingFieldsReader).toHaveBeenCalled();
      expect(
        inst!
          .find('[data-test-subj="unifiedFieldList__fieldListGroupedDescription"]')
          .first()
          .text()
      ).toBe('1 available field. 2 empty fields. 0 meta fields.');
    });

    it('does not load existence data if date and index pattern ids are unchanged', async () => {
      const props = testProps({
        currentIndexPatternId: 'a',
        otherProps: {
          dateRange: { fromDate: '2019-01-01', toDate: '2020-01-01' },
        },
      });

      (ExistingFieldsServiceApi.loadFieldExisting as jest.Mock).mockImplementation(async () => {
        return {
          existingFieldNames: [indexPatterns.a.fields[0].name, indexPatterns.a.fields[1].name],
        };
      });

      let inst: ReactWrapper;
      await act(async () => {
        inst = await mountWithIntl(<IndexPatternDataPanel {...props} />);
        inst.update();
      });

      expect(UseExistingFieldsApi.useExistingFieldsFetcher).toHaveBeenCalledWith(
        expect.objectContaining({
          dataViews: [indexPatterns.a],
          fromDate: props.dateRange.fromDate,
          toDate: props.dateRange.toDate,
        })
      );
      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledTimes(1);

      await act(async () => {
        await inst!.setProps({ dateRange: { fromDate: '2019-01-01', toDate: '2020-01-01' } });
        await inst!.update();
      });

      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledTimes(1);
    });

    it('loads existence data if date range changes', async () => {
      const props = testProps({
        currentIndexPatternId: 'a',
        otherProps: {
          dateRange: { fromDate: '2019-01-01', toDate: '2020-01-01' },
        },
      });

      (ExistingFieldsServiceApi.loadFieldExisting as jest.Mock).mockImplementation(async () => {
        return {
          existingFieldNames: [indexPatterns.a.fields[0].name, indexPatterns.a.fields[1].name],
        };
      });

      let inst: ReactWrapper;
      await act(async () => {
        inst = await mountWithIntl(<IndexPatternDataPanel {...props} />);
        inst.update();
      });

      expect(UseExistingFieldsApi.useExistingFieldsFetcher).toHaveBeenCalledWith(
        expect.objectContaining({
          dataViews: [indexPatterns.a],
          fromDate: props.dateRange.fromDate,
          toDate: props.dateRange.toDate,
        })
      );
      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledTimes(1);
      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: '2019-01-01',
          toDate: '2020-01-01',
          dslQuery,
          dataView: indexPatterns.a,
          timeFieldName: indexPatterns.a.timeFieldName,
        })
      );

      await act(async () => {
        await inst!.setProps({ dateRange: { fromDate: '2019-01-01', toDate: '2020-01-02' } });
        await inst!.update();
      });

      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledTimes(2);
      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: '2019-01-01',
          toDate: '2020-01-02',
          dslQuery,
          dataView: indexPatterns.a,
          timeFieldName: indexPatterns.a.timeFieldName,
        })
      );
    });

    it('loads existence data if layer index pattern changes', async () => {
      const props = testProps({
        currentIndexPatternId: 'a',
        otherProps: {
          dateRange: { fromDate: '2019-01-01', toDate: '2020-01-01' },
        },
      });

      (ExistingFieldsServiceApi.loadFieldExisting as jest.Mock).mockImplementation(
        async ({ dataView }) => {
          return {
            existingFieldNames:
              dataView === indexPatterns.a
                ? [indexPatterns.a.fields[0].name, indexPatterns.a.fields[1].name]
                : [indexPatterns.b.fields[0].name],
          };
        }
      );

      let inst: ReactWrapper;
      await act(async () => {
        inst = await mountWithIntl(<IndexPatternDataPanel {...props} />);
        inst.update();
      });

      expect(UseExistingFieldsApi.useExistingFieldsFetcher).toHaveBeenCalledWith(
        expect.objectContaining({
          dataViews: [indexPatterns.a],
          fromDate: props.dateRange.fromDate,
          toDate: props.dateRange.toDate,
        })
      );
      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledTimes(1);
      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: '2019-01-01',
          toDate: '2020-01-01',
          dslQuery,
          dataView: indexPatterns.a,
          timeFieldName: indexPatterns.a.timeFieldName,
        })
      );

      expect(
        inst!
          .find('[data-test-subj="unifiedFieldList__fieldListGroupedDescription"]')
          .first()
          .text()
      ).toBe('2 available fields. 3 empty fields. 0 meta fields.');

      await act(async () => {
        await inst!.setProps({
          currentIndexPatternId: 'b',
          state: {
            currentIndexPatternId: 'b',
            layers: {
              1: {
                indexPatternId: 'b',
                columnOrder: [],
                columns: {},
              },
            },
          } as IndexPatternPrivateState,
        });
        await inst!.update();
      });

      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledTimes(2);
      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: '2019-01-01',
          toDate: '2020-01-01',
          dslQuery,
          dataView: indexPatterns.b,
          timeFieldName: indexPatterns.b.timeFieldName,
        })
      );

      expect(
        inst!
          .find('[data-test-subj="unifiedFieldList__fieldListGroupedDescription"]')
          .first()
          .text()
      ).toBe('1 available field. 2 empty fields. 0 meta fields.');
    });

    it('shows a loading indicator when loading', async () => {
      const props = testProps({
        currentIndexPatternId: 'b',
      });

      let resolveFunction: (arg: unknown) => void;
      (ExistingFieldsServiceApi.loadFieldExisting as jest.Mock).mockReset();
      (ExistingFieldsServiceApi.loadFieldExisting as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          resolveFunction = resolve;
        });
      });
      let inst: ReactWrapper;

      await act(async () => {
        inst = await mountWithIntl(<IndexPatternDataPanel {...props} />);
        await inst.update();
      });

      await inst!.update();
      expect(inst!.find(EuiProgress).length).toEqual(1);
      expect(
        inst!
          .find('[data-test-subj="unifiedFieldList__fieldListGroupedDescription"]')
          .first()
          .text()
      ).toBe('3 available fields. 0 empty fields. 0 meta fields.');

      await act(() => {
        resolveFunction!({
          existingFieldNames: [indexPatterns.b.fields[0].name],
        });
      });

      await inst!.update();
      expect(inst!.find(EuiProgress).length).toEqual(0);
      expect(
        inst!
          .find('[data-test-subj="unifiedFieldList__fieldListGroupedDescription"]')
          .first()
          .text()
      ).toBe('1 available field. 2 empty fields. 0 meta fields.');
    });

    it("should trigger showNoDataPopover if fields don't have data", async () => {
      const props = testProps({
        currentIndexPatternId: 'a',
      });

      (ExistingFieldsServiceApi.loadFieldExisting as jest.Mock).mockImplementation(async () => {
        return {
          existingFieldNames: [],
        };
      });

      let inst: ReactWrapper;

      await act(async () => {
        inst = await mountWithIntl(<IndexPatternDataPanel {...props} />);
        await inst.update();
      });

      await inst!.update();

      expect(defaultProps.showNoDataPopover).toHaveBeenCalled();

      expect(
        inst!
          .find('[data-test-subj="unifiedFieldList__fieldListGroupedDescription"]')
          .first()
          .text()
      ).toBe('0 available fields. 5 empty fields. 0 meta fields.');
    });

    it("should default to empty dsl if query can't be parsed", async () => {
      const props = testProps({
        currentIndexPatternId: 'a',
        otherProps: {
          query: {
            language: 'kuery',
            query: '@timestamp : NOT *',
          },
        },
      });

      (ExistingFieldsServiceApi.loadFieldExisting as jest.Mock).mockImplementation(async () => {
        return {
          existingFieldNames: [indexPatterns.a.fields[0].name, indexPatterns.a.fields[1].name],
        };
      });

      let inst: ReactWrapper;

      await act(async () => {
        inst = await mountWithIntl(<IndexPatternDataPanel {...props} />);
        await inst.update();
      });

      await inst!.update();

      expect(ExistingFieldsServiceApi.loadFieldExisting).toHaveBeenCalledWith(
        expect.objectContaining({
          dslQuery: {
            bool: {
              must_not: {
                match_all: {},
              },
            },
          },
        })
      );

      expect(
        inst!
          .find('[data-test-subj="unifiedFieldList__fieldListGroupedDescription"]')
          .first()
          .text()
      ).toBe('2 available fields. 3 empty fields. 0 meta fields.');
    });
  });

  describe('displaying field list', () => {
    let props: Parameters<typeof InnerIndexPatternDataPanel>[0];
    beforeEach(() => {
      props = {
        ...defaultProps,
        frame: getFrameAPIMock({
          existingFields: {
            idx1: {
              bytes: true,
              memory: true,
            },
          },
        }),
      };
    });
    it('should list all supported fields in the pattern sorted alphabetically in groups', async () => {
      const wrapper = mountWithIntl(<InnerIndexPatternDataPanel {...props} />);
      expect(wrapper.find(FieldItem).first().prop('field').displayName).toEqual('Records');
      expect(
        wrapper
          .find('[data-test-subj="lnsIndexPatternAvailableFields"]')
          .find(FieldItem)
          .map((fieldItem) => fieldItem.prop('field').name)
      ).toEqual(['memory', 'bytes']);
      wrapper
        .find('[data-test-subj="lnsIndexPatternEmptyFields"]')
        .find('button')
        .first()
        .simulate('click');
      const emptyAccordion = wrapper.find('[data-test-subj="lnsIndexPatternEmptyFields"]');
      expect(
        emptyAccordion.find(FieldItem).map((fieldItem) => fieldItem.prop('field').name)
      ).toEqual(['client', 'source', 'timestamp']);
      expect(
        emptyAccordion.find(FieldItem).map((fieldItem) => fieldItem.prop('field').displayName)
      ).toEqual(['client', 'source', 'timestampLabel']);
    });

    it('should show meta fields accordion', async () => {
      const wrapper = mountWithIntl(
        <InnerIndexPatternDataPanel
          {...props}
          frame={getFrameAPIMock({
            indexPatterns: {
              '1': {
                ...props.frame.dataViews.indexPatterns['1'],
                fields: [
                  ...props.frame.dataViews.indexPatterns['1'].fields,
                  {
                    name: '_id',
                    displayName: '_id',
                    meta: true,
                    type: 'string',
                    searchable: true,
                    aggregatable: true,
                  },
                ],
              },
            },
          })}
        />
      );
      wrapper
        .find('[data-test-subj="lnsIndexPatternMetaFields"]')
        .find('button')
        .first()
        .simulate('click');
      expect(
        wrapper
          .find('[data-test-subj="lnsIndexPatternMetaFields"]')
          .find(FieldItem)
          .first()
          .prop('field').name
      ).toEqual('_id');
    });

    it('should display NoFieldsCallout when all fields are empty', async () => {
      const wrapper = mountWithIntl(
        <InnerIndexPatternDataPanel
          {...defaultProps}
          frame={getFrameAPIMock({ existingFields: { idx1: {} } })}
        />
      );
      expect(wrapper.find(EuiCallOut).length).toEqual(2);
      expect(
        wrapper
          .find('[data-test-subj="lnsIndexPatternAvailableFields"]')
          .find(FieldItem)
          .map((fieldItem) => fieldItem.prop('field').name)
      ).toEqual([]);
      wrapper
        .find('[data-test-subj="lnsIndexPatternEmptyFields"]')
        .find('button')
        .first()
        .simulate('click');
      expect(
        wrapper
          .find('[data-test-subj="lnsIndexPatternEmptyFields"]')
          .find(FieldItem)
          .map((fieldItem) => fieldItem.prop('field').displayName)
      ).toEqual(['amemory', 'bytes', 'client', 'source', 'timestampLabel']);
    });

    it('should display spinner for available fields accordion if existing fields are not loaded yet', async () => {
      const wrapper = mountWithIntl(
        <InnerIndexPatternDataPanel
          {...defaultProps}
          frame={getFrameAPIMock({ existingFields: {} })}
        />
      );
      expect(
        wrapper.find('[data-test-subj="lnsIndexPatternAvailableFields"]').find(EuiLoadingSpinner)
          .length
      ).toEqual(1);
      wrapper.setProps({ frame: getFrameAPIMock({ existingFields: { idx1: {} } }) });
      expect(wrapper.find(EuiCallOut).length).toEqual(2);
    });

    // TODO: refactor these tests
    // it('renders correct number of Field Items', () => {
    //   const wrapper = mountWithIntl(
    //     <FieldsAccordion {...defaultProps} exists={(field) => field.name === 'timestamp'} />
    //   );
    //   expect(wrapper.find(FieldItem).at(0).prop('exists')).toEqual(true);
    //   expect(wrapper.find(FieldItem).at(1).prop('exists')).toEqual(false);
    // });
    //
    // it('passed correct exists flag to each field', () => {
    //   const wrapper = mountWithIntl(<FieldsAccordion {...defaultProps} />);
    //   expect(wrapper.find(FieldItem).length).toEqual(2);
    // });

    it('should not allow field details when error', () => {
      const wrapper = mountWithIntl(
        <InnerIndexPatternDataPanel
          {...props}
          frame={getFrameAPIMock({ existenceFetchFailed: true })}
        />
      );

      expect(wrapper.find(FieldList).prop('fieldGroups')).toEqual(
        expect.objectContaining({
          AvailableFields: expect.objectContaining({ hideDetails: true }),
        })
      );
    });

    it('should allow field details when timeout', () => {
      const wrapper = mountWithIntl(
        <InnerIndexPatternDataPanel
          {...props}
          frame={getFrameAPIMock({ existenceFetchTimeout: true })}
        />
      );

      expect(wrapper.find(FieldList).prop('fieldGroups')).toEqual(
        expect.objectContaining({
          AvailableFields: expect.objectContaining({ hideDetails: false }),
        })
      );
    });

    it('should filter down by name', () => {
      const wrapper = mountWithIntl(<InnerIndexPatternDataPanel {...props} />);
      act(() => {
        wrapper.find('[data-test-subj="lnsIndexPatternFieldSearch"]').simulate('change', {
          target: { value: 'me' },
        });
      });

      wrapper
        .find('[data-test-subj="lnsIndexPatternEmptyFields"] button')
        .first()
        .simulate('click');

      expect(wrapper.find(FieldItem).map((fieldItem) => fieldItem.prop('field').name)).toEqual([
        'memory',
        'timestamp',
      ]);
    });

    it('should announce filter in live region', () => {
      const wrapper = mountWithIntl(<InnerIndexPatternDataPanel {...props} />);
      act(() => {
        wrapper.find('[data-test-subj="lnsIndexPatternFieldSearch"]').simulate('change', {
          target: { value: 'me' },
        });
      });

      wrapper
        .find('[data-test-subj="lnsIndexPatternEmptyFields"]')
        .find('button')
        .first()
        .simulate('click');

      expect(wrapper.find('[aria-live="polite"]').at(1).text()).toEqual(
        '1 available field. 1 empty field. 0 meta fields.'
      );
    });

    it('should filter down by type', () => {
      const wrapper = mountWithIntl(<InnerIndexPatternDataPanel {...props} />);

      wrapper.find('[data-test-subj="lnsIndexPatternFiltersToggle"]').first().simulate('click');

      wrapper.find('[data-test-subj="typeFilter-number"]').first().simulate('click');

      expect(
        wrapper.find(FieldItem).map((fieldItem) => fieldItem.prop('field').displayName)
      ).toEqual(['amemory', 'bytes']);
    });

    it('should display no fields in groups when filtered by type Record', () => {
      const wrapper = mountWithIntl(<InnerIndexPatternDataPanel {...props} />);

      wrapper.find('[data-test-subj="lnsIndexPatternFiltersToggle"]').first().simulate('click');

      wrapper.find('[data-test-subj="typeFilter-document"]').first().simulate('click');

      expect(wrapper.find(FieldItem).map((fieldItem) => fieldItem.prop('field').name)).toEqual([
        DOCUMENT_FIELD_NAME,
      ]);
      expect(wrapper.find(EuiCallOut).length).toEqual(3);
    });

    it('should toggle type if clicked again', () => {
      const wrapper = mountWithIntl(<InnerIndexPatternDataPanel {...props} />);
      wrapper.find('[data-test-subj="lnsIndexPatternFiltersToggle"]').first().simulate('click');

      wrapper.find('[data-test-subj="typeFilter-number"]').first().simulate('click');
      wrapper.find('[data-test-subj="typeFilter-number"]').first().simulate('click');
      wrapper
        .find('[data-test-subj="lnsIndexPatternEmptyFields"]')
        .find('button')
        .first()
        .simulate('click');
      expect(
        wrapper.find(FieldItem).map((fieldItem) => fieldItem.prop('field').displayName)
      ).toEqual(['Records', 'amemory', 'bytes', 'client', 'source', 'timestampLabel']);
    });

    it('should filter down by type and by name', () => {
      const wrapper = mountWithIntl(<InnerIndexPatternDataPanel {...props} />);
      act(() => {
        wrapper.find('[data-test-subj="lnsIndexPatternFieldSearch"]').simulate('change', {
          target: { value: 'me' },
        });
      });

      wrapper.find('[data-test-subj="lnsIndexPatternFiltersToggle"]').first().simulate('click');

      wrapper.find('[data-test-subj="typeFilter-number"]').first().simulate('click');

      expect(wrapper.find(FieldItem).map((fieldItem) => fieldItem.prop('field').name)).toEqual([
        'memory',
      ]);
    });
  });
});
