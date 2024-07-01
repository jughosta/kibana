/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { renderHook } from '@testing-library/react-hooks';
import {
  useConversationsTable,
  GetConversationsListParams,
  ConversationTableItem,
} from './use_conversations_table';
import { alertConvo, welcomeConvo, customConvo } from '../../../mock/conversation';
import { mockActionTypes, mockConnectors } from '../../../mock/connectors';
import { mockSystemPrompts } from '../../../mock/system_prompt';
import { ActionTypeRegistryContract } from '@kbn/triggers-actions-ui-plugin/public';
import * as i18n from './translations';
import { EuiTableFieldDataColumnType } from '@elastic/eui';

const mockActionTypeRegistry: ActionTypeRegistryContract = {
  has: jest
    .fn()
    .mockImplementation((id: string) =>
      mockActionTypes.some((actionType: { id: string }) => actionType.id === id)
    ),
  get: jest
    .fn()
    .mockImplementation((id: string) =>
      mockActionTypes.find((actionType: { id: string }) => actionType.id === id)
    ),
  list: jest.fn().mockReturnValue(mockActionTypes),
  register: jest.fn(),
};

describe('useConversationsTable', () => {
  it('should return columns', () => {
    const { result } = renderHook(() => useConversationsTable());
    const columns = result.current.getColumns({
      onDeleteActionClicked: jest.fn(),
      onEditActionClicked: jest.fn(),
    });

    expect(columns).toHaveLength(5);

    expect(columns[0].name).toBe(i18n.CONVERSATIONS_TABLE_COLUMN_NAME);
    expect((columns[1] as EuiTableFieldDataColumnType<ConversationTableItem>).field).toBe(
      'systemPromptTitle'
    );
    expect((columns[2] as EuiTableFieldDataColumnType<ConversationTableItem>).field).toBe(
      'connectorTypeTitle'
    );
    expect((columns[3] as EuiTableFieldDataColumnType<ConversationTableItem>).field).toBe(
      'updatedAt'
    );
    expect(columns[4].name).toBe(i18n.CONVERSATIONS_TABLE_COLUMN_ACTIONS);
  });

  it('should return a list of conversations', () => {
    const alertConvoId = 'alert-convo-id';
    const welcomeConvoId = 'welcome-convo-id';
    const customConvoId = 'custom-convo-id';
    const params: GetConversationsListParams = {
      allSystemPrompts: mockSystemPrompts,
      actionTypeRegistry: mockActionTypeRegistry,
      connectors: mockConnectors,
      conversations: {
        [alertConvoId]: { ...alertConvo, id: alertConvoId },
        [welcomeConvoId]: { ...welcomeConvo, id: welcomeConvoId },
        [customConvoId]: { ...customConvo, id: customConvoId },
      },
      defaultConnector: mockConnectors[0],
    };

    const { result } = renderHook(() => useConversationsTable());
    const conversationsList: ConversationTableItem[] = result.current.getConversationsList(params);

    expect(conversationsList).toHaveLength(3);

    expect(conversationsList[0].title).toBe(alertConvo.title);
    expect(conversationsList[0].connectorTypeTitle).toBe('OpenAI');
    expect(conversationsList[0].systemPromptTitle).toBe('Mock system prompt');

    expect(conversationsList[1].title).toBe(welcomeConvo.title);
    expect(conversationsList[1].connectorTypeTitle).toBe('OpenAI');
    expect(conversationsList[1].systemPromptTitle).toBe('Mock system prompt');

    expect(conversationsList[2].title).toBe(customConvo.title);
    expect(conversationsList[2].connectorTypeTitle).toBe('OpenAI');
    expect(conversationsList[2].systemPromptTitle).toBe('Mock system prompt');
  });
});
