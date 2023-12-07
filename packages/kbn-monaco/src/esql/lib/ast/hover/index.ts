/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { i18n } from '@kbn/i18n';
import type { monaco } from '../../../../monaco_imports';
import { getFunctionSignatures } from '../definitions/helpers';
import { getAstContext } from '../shared/context';
import { monacoPositionToOffset, getFunctionDefinition, isSourceItem } from '../shared/helpers';
import { getPolicyHelper } from '../shared/resources_helpers';
import { ESQLCallbacks } from '../shared/types';
import type { AstProviderFn } from '../types';

export async function getHoverItem(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  token: monaco.CancellationToken,
  astProvider: AstProviderFn,
  resourceRetriever?: ESQLCallbacks
) {
  const innerText = model.getValue();
  const offset = monacoPositionToOffset(innerText, position);

  const { ast } = await astProvider(innerText);
  const astContext = getAstContext(innerText, ast, offset);
  const { getPolicyMetadata } = getPolicyHelper(resourceRetriever);

  if (['newCommand', 'list'].includes(astContext.type)) {
    return { contents: [] };
  }

  if (astContext.type === 'function') {
    const fnDefinition = getFunctionDefinition(astContext.node.name);

    if (fnDefinition) {
      return {
        contents: [
          { value: getFunctionSignatures(fnDefinition)[0].declaration },
          { value: fnDefinition.description },
        ],
      };
    }
  }

  if (astContext.type === 'expression') {
    if (
      astContext.node &&
      isSourceItem(astContext.node) &&
      astContext.node.sourceType === 'policy'
    ) {
      const policyMetadata = await getPolicyMetadata(astContext.node.name);
      if (policyMetadata) {
        return {
          contents: [
            {
              value: `${i18n.translate('monaco.esql.hover.policyIndexes', {
                defaultMessage: '**Indexes**',
              })}: ${policyMetadata.sourceIndices}`,
            },
            {
              value: `${i18n.translate('monaco.esql.hover.policyMatchingField', {
                defaultMessage: '**Matching field**',
              })}: ${policyMetadata.matchField}`,
            },
            {
              value: `${i18n.translate('monaco.esql.hover.policyEnrichedFields', {
                defaultMessage: '**Fields**',
              })}: ${policyMetadata.enrichFields}`,
            },
          ],
        };
      }
    }
  }

  return { contents: [] };
}
