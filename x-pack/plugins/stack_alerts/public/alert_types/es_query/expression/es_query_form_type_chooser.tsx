/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiListGroup, EuiListGroupItem, EuiText, EuiTitle } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';

export enum EsQueryFormType {
  KQL_OR_LUCENE = 'kql_or_lucene',
  QUERY_DSL = 'query_dsl',
}

const FORM_TYPE_ITEMS: Array<{ formType: EsQueryFormType; label: string; description: string }> = [
  {
    formType: EsQueryFormType.KQL_OR_LUCENE,
    label: i18n.translate(
      'xpack.stackAlerts.esQuery.ui.selectQueryFormType.kqlOrLuceneFormTypeLabel',
      {
        defaultMessage: 'KQL or Lucene',
      }
    ),
    description: i18n.translate(
      'xpack.stackAlerts.esQuery.ui.selectQueryFormType.kqlOrLuceneFormTypeDescription',
      {
        defaultMessage:
          'Make use of a data view, write the query using KQL or Lucene and add filters.',
      }
    ),
  },
  {
    formType: EsQueryFormType.QUERY_DSL,
    label: i18n.translate(
      'xpack.stackAlerts.esQuery.ui.selectQueryFormType.queryDslFormTypeLabel',
      {
        defaultMessage: 'Query DSL',
      }
    ),
    description: i18n.translate(
      'xpack.stackAlerts.esQuery.ui.selectQueryFormType.queryDslFormTypeDescription',
      {
        defaultMessage: 'Make use of the powerful Query DSL of Elasticsearch.',
      }
    ),
  },
];

export interface EsQueryFormTypeProps {
  onFormTypeSelect: (formType: EsQueryFormType) => void;
}

export const EsQueryFormTypeChooser: React.FC<EsQueryFormTypeProps> = ({ onFormTypeSelect }) => {
  return (
    <>
      <EuiTitle size="xxs">
        <h5>
          <FormattedMessage
            id="xpack.stackAlerts.esQuery.ui.selectQueryFormTypeLabel"
            defaultMessage="Select query type"
          />
        </h5>
      </EuiTitle>
      <EuiListGroup flush gutterSize="m" size="l" maxWidth={false}>
        {FORM_TYPE_ITEMS.map((item) => (
          <EuiListGroupItem
            wrapText
            key={`form-type-${item.formType}`}
            data-test-subj={`formType-${item.formType}`}
            color="primary"
            label={
              <span>
                <strong>{item.label}</strong>
                <EuiText color="subdued" size="s">
                  <p>{item.description}</p>
                </EuiText>
              </span>
            }
            onClick={() => onFormTypeSelect(item.formType)}
          />
        ))}
      </EuiListGroup>
    </>
  );
};
