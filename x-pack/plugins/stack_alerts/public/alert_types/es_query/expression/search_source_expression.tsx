/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useState } from 'react';
import './search_source_expression.scss';
import { EuiSpacer, EuiLoadingSpinner, EuiEmptyPrompt, EuiCallOut } from '@elastic/eui';
import { ISearchSource } from '@kbn/data-plugin/common';
import { RuleTypeParamsExpressionProps } from '@kbn/triggers-actions-ui-plugin/public';
import { SavedQuery } from '@kbn/data-plugin/public';
import { EsQueryAlertParams, SearchType } from '../types';
import { useTriggersAndActionsUiDeps } from '../util';
import { SearchSourceExpressionForm } from './search_source_expression_form';
import { DEFAULT_VALUES } from '../constants';

export type SearchSourceExpressionProps = RuleTypeParamsExpressionProps<
  EsQueryAlertParams<SearchType.searchSource>
> & {
  shouldResetSearchConfiguration?: boolean;
};

export const SearchSourceExpression = ({
  ruleParams,
  errors,
  setRuleParams,
  setRuleProperty,
  shouldResetSearchConfiguration,
}: SearchSourceExpressionProps) => {
  const {
    thresholdComparator,
    threshold,
    timeWindowSize,
    timeWindowUnit,
    size,
    savedQueryId,
    searchConfiguration,
  } = ruleParams;
  const { data } = useTriggersAndActionsUiDeps();

  const [searchSource, setSearchSource] = useState<ISearchSource>();
  const [savedQuery, setSavedQuery] = useState<SavedQuery>();
  const [paramsError, setParamsError] = useState<Error>();

  const setParam = useCallback(
    (paramField: string, paramValue: unknown) => setRuleParams(paramField, paramValue),
    [setRuleParams]
  );

  useEffect(() => {
    let initialSearchConfiguration = searchConfiguration;

    if (shouldResetSearchConfiguration) {
      const newSearchSource = data.search.searchSource.createEmpty();
      newSearchSource.setField('query', data.query.queryString.getDefaultQuery());
      initialSearchConfiguration = newSearchSource.getSerializedFields();
    }

    setRuleProperty('params', {
      searchConfiguration: initialSearchConfiguration,
      searchType: SearchType.searchSource,
      timeWindowSize: timeWindowSize ?? DEFAULT_VALUES.TIME_WINDOW_SIZE,
      timeWindowUnit: timeWindowUnit ?? DEFAULT_VALUES.TIME_WINDOW_UNIT,
      threshold: threshold ?? DEFAULT_VALUES.THRESHOLD,
      thresholdComparator: thresholdComparator ?? DEFAULT_VALUES.THRESHOLD_COMPARATOR,
      size: size ?? DEFAULT_VALUES.SIZE,
    });

    const initSearchSource = () =>
      data.search.searchSource
        .create(initialSearchConfiguration)
        .then((fetchedSearchSource) => setSearchSource(fetchedSearchSource))
        .catch(setParamsError);

    initSearchSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.search.searchSource, data.dataViews, shouldResetSearchConfiguration]);

  useEffect(() => {
    if (savedQueryId) {
      data.query.savedQueries.getSavedQuery(savedQueryId).then(setSavedQuery);
    }
  }, [data.query.savedQueries, savedQueryId]);

  if (paramsError) {
    return (
      <>
        <EuiCallOut color="danger" iconType="alert">
          <p>{paramsError.message}</p>
        </EuiCallOut>
        <EuiSpacer size="s" />
      </>
    );
  }

  if (!searchSource) {
    return <EuiEmptyPrompt title={<EuiLoadingSpinner size="xl" />} />;
  }

  return (
    <SearchSourceExpressionForm
      ruleParams={ruleParams}
      searchSource={searchSource}
      errors={errors}
      initialSavedQuery={savedQuery}
      setParam={setParam}
    />
  );
};
