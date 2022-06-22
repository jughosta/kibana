/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { firstValueFrom } from 'rxjs';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { XJsonMode } from '@kbn/ace';
import 'brace/theme/github';

import { EuiFormRow, EuiLink, EuiSpacer, EuiTitle } from '@elastic/eui';
import { DocLinksStart, HttpSetup } from '@kbn/core/public';

import { EuiCodeEditor, XJson } from '@kbn/es-ui-shared-plugin/public';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { getFields, RuleTypeParamsExpressionProps } from '@kbn/triggers-actions-ui-plugin/public';
import { parseDuration } from '@kbn/alerting-plugin/common';
import { validateExpression } from '../validation';
import { buildSortedEventsQuery } from '../../../../common/build_sorted_events_query';
import { EsQueryAlertParams, SearchType } from '../types';
import { IndexSelectPopover } from '../../components/index_select_popover';
import { DEFAULT_VALUES } from '../constants';
import { RuleCommonExpressions } from '../rule_common_expressions';
import { totalHitsToNumber } from '../test_query_row';

const { useXJsonMode } = XJson;
const xJsonMode = new XJsonMode();

interface KibanaDeps {
  http: HttpSetup;
  docLinks: DocLinksStart;
}

export const EsQueryExpression: React.FC<
  RuleTypeParamsExpressionProps<EsQueryAlertParams<SearchType.esQuery>>
> = ({ ruleParams, setRuleParams, setRuleProperty, errors, data }) => {
  const {
    index,
    timeField,
    esQuery,
    size,
    thresholdComparator,
    threshold,
    timeWindowSize,
    timeWindowUnit,
  } = ruleParams;

  const [currentAlertParams, setCurrentAlertParams] = useState<
    EsQueryAlertParams<SearchType.esQuery>
  >({
    ...ruleParams,
    timeWindowSize: timeWindowSize ?? DEFAULT_VALUES.TIME_WINDOW_SIZE,
    timeWindowUnit: timeWindowUnit ?? DEFAULT_VALUES.TIME_WINDOW_UNIT,
    threshold: threshold ?? DEFAULT_VALUES.THRESHOLD,
    thresholdComparator: thresholdComparator ?? DEFAULT_VALUES.THRESHOLD_COMPARATOR,
    size: size ?? DEFAULT_VALUES.SIZE,
    esQuery: esQuery ?? DEFAULT_VALUES.QUERY,
    searchType: 'esQuery',
  });

  const setParam = useCallback(
    (paramField: string, paramValue: unknown) => {
      setCurrentAlertParams((currentParams) => ({
        ...currentParams,
        [paramField]: paramValue,
      }));
      setRuleParams(paramField, paramValue);
    },
    [setRuleParams]
  );

  const { http, docLinks } = useKibana<KibanaDeps>().services;

  const [esFields, setEsFields] = useState<
    Array<{
      name: string;
      type: string;
      normalizedType: string;
      searchable: boolean;
      aggregatable: boolean;
    }>
  >([]);
  const { convertToJson, setXJson, xJson } = useXJsonMode(DEFAULT_VALUES.QUERY);

  const setDefaultExpressionValues = async () => {
    setRuleProperty('params', currentAlertParams);
    setXJson(esQuery ?? DEFAULT_VALUES.QUERY);

    if (index && index.length > 0) {
      await refreshEsFields();
    }
  };

  useEffect(() => {
    setDefaultExpressionValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshEsFields = async () => {
    if (index) {
      const currentEsFields = await getFields(http, index);
      setEsFields(currentEsFields);
    }
  };

  const hasValidationErrors = useCallback(() => {
    const { errors: validationErrors } = validateExpression(currentAlertParams);
    return Object.keys(validationErrors).some(
      (key) => validationErrors[key] && validationErrors[key].length
    );
  }, [currentAlertParams]);

  const onTestQuery = useCallback(async () => {
    const window = `${timeWindowSize}${timeWindowUnit}`;
    if (hasValidationErrors()) {
      return { nrOfDocs: 0, timeWindow: window };
    }
    const timeWindow = parseDuration(window);
    const parsedQuery = JSON.parse(esQuery);
    const now = Date.now();
    const { rawResponse } = await firstValueFrom(
      data.search.search({
        params: buildSortedEventsQuery({
          index,
          from: new Date(now - timeWindow).toISOString(),
          to: new Date(now).toISOString(),
          filter: parsedQuery.query,
          size: 0,
          searchAfterSortId: undefined,
          timeField: timeField ? timeField : '',
          track_total_hits: true,
        }),
      })
    );

    const hits = rawResponse.hits;
    return { nrOfDocs: totalHitsToNumber(hits.total), timeWindow: window };
  }, [data.search, esQuery, index, timeField, timeWindowSize, timeWindowUnit, hasValidationErrors]);

  return (
    <Fragment>
      <EuiTitle size="xs">
        <h5>
          <FormattedMessage
            id="xpack.stackAlerts.esQuery.ui.selectIndex"
            defaultMessage="Select an index and size"
          />
        </h5>
      </EuiTitle>

      <EuiSpacer size="s" />

      <IndexSelectPopover
        index={index}
        data-test-subj="indexSelectPopover"
        esFields={esFields}
        timeField={timeField}
        errors={errors}
        onIndexChange={async (indices: string[]) => {
          setParam('index', indices);

          // reset expression fields if indices are deleted
          if (indices.length === 0) {
            setRuleProperty('params', {
              ...ruleParams,
              index: indices,
              esQuery: DEFAULT_VALUES.QUERY,
              size: DEFAULT_VALUES.SIZE,
              thresholdComparator: DEFAULT_VALUES.THRESHOLD_COMPARATOR,
              timeWindowSize: DEFAULT_VALUES.TIME_WINDOW_SIZE,
              timeWindowUnit: DEFAULT_VALUES.TIME_WINDOW_UNIT,
              threshold: DEFAULT_VALUES.THRESHOLD,
              timeField: '',
            });
          } else {
            await refreshEsFields();
          }
        }}
        onTimeFieldChange={(updatedTimeField: string) => setParam('timeField', updatedTimeField)}
      />

      <EuiSpacer size="s" />

      <EuiTitle size="xs">
        <h5>
          <FormattedMessage
            id="xpack.stackAlerts.esQuery.ui.queryPrompt"
            defaultMessage="Define the Elasticsearch query"
          />
        </h5>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiFormRow
        id="queryEditor"
        fullWidth
        label={
          <FormattedMessage
            id="xpack.stackAlerts.esQuery.ui.queryPrompt.label"
            defaultMessage="Elasticsearch query"
          />
        }
        isInvalid={errors.esQuery.length > 0}
        error={errors.esQuery}
        helpText={
          <EuiLink href={docLinks.links.query.queryDsl} target="_blank">
            <FormattedMessage
              id="xpack.stackAlerts.esQuery.ui.queryPrompt.help"
              defaultMessage="Elasticsearch Query DSL documentation"
            />
          </EuiLink>
        }
      >
        <EuiCodeEditor
          mode={xJsonMode}
          width="100%"
          height="200px"
          theme="github"
          data-test-subj="queryJsonEditor"
          aria-label={i18n.translate('xpack.stackAlerts.esQuery.ui.queryEditor', {
            defaultMessage: 'Elasticsearch query editor',
          })}
          value={xJson}
          onChange={(xjson: string) => {
            setXJson(xjson);
            setParam('esQuery', convertToJson(xjson));
          }}
        />
      </EuiFormRow>

      <EuiSpacer />

      <RuleCommonExpressions
        threshold={threshold ?? DEFAULT_VALUES.THRESHOLD}
        thresholdComparator={thresholdComparator ?? DEFAULT_VALUES.THRESHOLD_COMPARATOR}
        timeWindowSize={timeWindowSize}
        timeWindowUnit={timeWindowUnit}
        size={size}
        onChangeThreshold={(selectedThresholds) => setParam('threshold', selectedThresholds)}
        onChangeThresholdComparator={(selectedThresholdComparator) =>
          setParam('thresholdComparator', selectedThresholdComparator)
        }
        onChangeWindowSize={(selectedWindowSize: number | undefined) =>
          setParam('timeWindowSize', selectedWindowSize)
        }
        onChangeWindowUnit={(selectedWindowUnit: string) =>
          setParam('timeWindowUnit', selectedWindowUnit)
        }
        onChangeSizeValue={(updatedValue) => {
          setParam('size', updatedValue);
        }}
        errors={errors}
        hasValidationErrors={hasValidationErrors()}
        onTestFetch={onTestQuery}
      />

      <EuiSpacer />
    </Fragment>
  );
};
