/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { generatePath } from 'react-router-dom';

import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiSteps,
  EuiText,
} from '@elastic/eui';
import { EuiContainedStepProps } from '@elastic/eui/src/components/steps/steps';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { ENTERPRISE_SEARCH_CONTENT_PLUGIN } from '../../../../../common/constants';
import {
  ML_MANAGE_TRAINED_MODELS_PATH,
  NEW_INDEX_PATH,
} from '../../../enterprise_search_content/routes';
import { docLinks } from '../../../shared/doc_links';
import { EuiLinkTo } from '../../../shared/react_router_helpers';

const steps: EuiContainedStepProps[] = [
  {
    title: i18n.translate('xpack.enterpriseSearch.esre.nlpEnrichmentPanel.step1.title', {
      defaultMessage: 'Learn how to upload ML models',
    }),
    children: (
      <EuiFlexGroup direction="column">
        <EuiFlexItem>
          <EuiLink href={docLinks.supportedNlpModels} target="_blank" external>
            {i18n.translate(
              'xpack.enterpriseSearch.esre.nlpEnrichmentPanel.step1.supportedNlpModelsLinkText',
              { defaultMessage: 'Supported NLP models' }
            )}
          </EuiLink>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiLink href={docLinks.trainedModels} target="_blank" external>
            {i18n.translate(
              'xpack.enterpriseSearch.esre.nlpEnrichmentPanel.step1.guideToTrainedModelsLinkText',
              { defaultMessage: 'Guide to trained models' }
            )}
          </EuiLink>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiLinkTo to={generatePath(ML_MANAGE_TRAINED_MODELS_PATH)} shouldNotCreateHref>
            <EuiButton iconType="eye">
              {i18n.translate('xpack.enterpriseSearch.esre.nlpEnrichmentPanel.step1.buttonLabel', {
                defaultMessage: 'View trained models',
              })}
            </EuiButton>
          </EuiLinkTo>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
    status: 'incomplete',
  },
  {
    title: i18n.translate('xpack.enterpriseSearch.esre.nlpEnrichmentPanel.step2.title', {
      defaultMessage: 'Create an index',
    }),
    children: (
      <EuiLinkTo
        to={generatePath(ENTERPRISE_SEARCH_CONTENT_PLUGIN.URL + NEW_INDEX_PATH)}
        shouldNotCreateHref
      >
        <EuiButton iconType="plusInCircle">
          {i18n.translate('xpack.enterpriseSearch.esre.nlpEnrichmentPanel.step2.buttonLabel', {
            defaultMessage: 'Create an index',
          })}
        </EuiButton>
      </EuiLinkTo>
    ),
    status: 'incomplete',
  },
  {
    title: i18n.translate('xpack.enterpriseSearch.esre.nlpEnrichmentPanel.step3.title', {
      defaultMessage: 'Create an ML inference pipeline',
    }),
    children: (
      <EuiText>
        <p>
          <FormattedMessage
            id="xpack.enterpriseSearch.esre.nlpEnrichmentPanel.step3.description"
            defaultMessage="Navigate to your index's {pipelinesName} tab to create an inference pipeline that uses your deployed model."
            values={{
              pipelinesName: (
                <strong>
                  &quot;
                  {i18n.translate(
                    'xpack.enterpriseSearch.esre.nlpEnrichmentPanel.step3.description.pipelinesName',
                    {
                      defaultMessage: 'Pipelines',
                    }
                  )}
                  &quot;
                </strong>
              ),
            }}
          />
        </p>
      </EuiText>
    ),
    status: 'incomplete',
  },
];

export const NlpEnrichmentPanel: React.FC = () => (
  <>
    <EuiSpacer />
    <EuiFlexGroup direction="column">
      <EuiFlexItem grow={false}>
        <EuiText>
          <p>
            <FormattedMessage
              id="xpack.enterpriseSearch.esre.nlpEnrichmentPanel.description"
              defaultMessage="Use Natural Language Processing (NLP) tools like sentiment analysis, summarization, or Named Entity Recognition to enhance the relevance of your search results. NLP uses several {supportedMlModels} you can load to intelligently analyze and enrich documents with additional fields."
              values={{
                supportedMlModels: (
                  <EuiLink target="_blank" href={docLinks.supportedNlpModels} external={false}>
                    {i18n.translate(
                      'xpack.enterpriseSearch.esre.nlpEnrichmentPanel.description.supportedMlModelsLinkText',
                      {
                        defaultMessage: 'supported ML models',
                      }
                    )}
                  </EuiLink>
                ),
              }}
            />
          </p>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiSteps steps={steps} titleSize="xs" />
      </EuiFlexItem>
    </EuiFlexGroup>
  </>
);
