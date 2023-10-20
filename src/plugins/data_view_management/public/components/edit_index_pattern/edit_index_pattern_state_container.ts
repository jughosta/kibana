/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { createHashHistory } from 'history';
import {
  createStateContainer,
  syncState,
  createKbnUrlStateStorage,
} from '@kbn/kibana-utils-plugin/public';

interface IEditIndexPatternState {
  tab: string;
  fieldTypes?: string[];
}

// query param to store app state at
export const APP_STATE_STORAGE_KEY = '_a';

/**
 * Create state container with sync config for tab navigation specific for edit_index_pattern page
 */
export function createEditIndexPatternPageStateContainer({
  defaultTab,
  useHashedUrl,
}: {
  defaultTab: string;
  useHashedUrl: boolean;
}) {
  const history = createHashHistory();
  // default app state, when there is no initial state in the url
  const defaultState = {
    tab: defaultTab,
  };
  const kbnUrlStateStorage = createKbnUrlStateStorage({
    useHash: useHashedUrl,
    history,
  });
  // extract starting app state from URL and use it as starting app state in state container
  const initialStateFromUrl = kbnUrlStateStorage.get<IEditIndexPatternState>(APP_STATE_STORAGE_KEY);
  const stateContainer = createStateContainer(
    {
      ...defaultState,
      ...initialStateFromUrl,
    },
    {
      setTab: (state: IEditIndexPatternState) => (tab: string) => ({ ...state, tab }),
      setFieldTypes: (state: IEditIndexPatternState) => (fieldTypes: string[]) => ({
        ...state,
        fieldTypes: fieldTypes.length ? fieldTypes : undefined,
      }),
    },
    {
      tab: (state: IEditIndexPatternState) => () => state.tab,
      fieldTypes: (state: IEditIndexPatternState) => () => state.fieldTypes,
    }
  );

  const { start, stop } = syncState({
    storageKey: APP_STATE_STORAGE_KEY,
    stateContainer: {
      ...stateContainer,
      // state syncing utility requires state containers to handle "null"
      set: (state) => state && stateContainer.set(state),
    },
    stateStorage: kbnUrlStateStorage,
  });

  // makes sure initial url is the same as initial state (this is not really required)
  kbnUrlStateStorage.set(APP_STATE_STORAGE_KEY, stateContainer.getState(), { replace: true });

  return {
    startSyncingState: start,
    stopSyncingState: stop,
    setCurrentTab: (newTab: string) => stateContainer.transitions.setTab(newTab),
    getCurrentTab: () => stateContainer.selectors.tab(),
    setCurrentFieldTypes: (newFieldTypes: string[]) =>
      stateContainer.transitions.setFieldTypes(newFieldTypes),
    getCurrentFieldTypes: () => stateContainer.selectors.fieldTypes(),
  };
}
