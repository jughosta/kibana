/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import type { DataView } from '@kbn/data-views-plugin/public';
import type { TopNavMenuData } from '@kbn/navigation-plugin/public';
import { METRIC_TYPE } from '@kbn/analytics';
import { ENABLE_ESQL } from '@kbn/esql-utils';
import { AppMenuDiscoverParams, AppMenuItem } from '@kbn/discover-utils';
import { ESQL_TRANSITION_MODAL_KEY } from '../../../../../common/constants';
import { DiscoverServices } from '../../../../build_services';
import { onSaveSearch } from './on_save_search';
import { DiscoverStateContainer } from '../../state_management/discover_state';
import {
  getAlertsAppMenuItem,
  getNewSearchAppMenuItem,
  getOpenSearchAppMenuItem,
  getShareAppMenuItem,
  getInspectAppMenuItem,
} from './app_menu_actions';
import type { TopNavCustomization } from '../../../../customizations';
import { runAppMenuAction, runAppMenuPopoverAction } from './run_app_menu_action';

/**
 * Helper function to build the top nav links
 */
export const getTopNavLinks = ({
  dataView,
  services,
  state,
  onOpenInspector,
  isEsqlMode,
  adHocDataViews,
  topNavCustomization,
  shouldShowESQLToDataViewTransitionModal,
}: {
  dataView: DataView | undefined;
  services: DiscoverServices;
  state: DiscoverStateContainer;
  onOpenInspector: () => void;
  isEsqlMode: boolean;
  adHocDataViews: DataView[];
  topNavCustomization: TopNavCustomization | undefined;
  shouldShowESQLToDataViewTransitionModal: boolean;
}): TopNavMenuData[] => {
  /**
   * Switches from ES|QL to classic mode and vice versa
   */
  const esqLDataViewTransitionToggle = {
    id: 'esql',
    label: isEsqlMode
      ? i18n.translate('discover.localMenu.switchToClassicTitle', {
          defaultMessage: 'Switch to classic',
        })
      : i18n.translate('discover.localMenu.tryESQLTitle', {
          defaultMessage: 'Try ES|QL',
        }),
    emphasize: true,
    fill: false,
    color: 'text',
    tooltip: isEsqlMode
      ? i18n.translate('discover.localMenu.switchToClassicTooltipLabel', {
          defaultMessage: 'Switch to KQL or Lucene syntax.',
        })
      : i18n.translate('discover.localMenu.esqlTooltipLabel', {
          defaultMessage: `ES|QL is Elastic's powerful new piped query language.`,
        }),
    run: () => {
      if (dataView) {
        if (isEsqlMode) {
          services.trackUiMetric?.(METRIC_TYPE.CLICK, `esql:back_to_classic_clicked`);
          /**
           * Display the transition modal if:
           * - the user has not dismissed the modal
           * - the user has opened and applied changes to the saved search
           */
          if (
            shouldShowESQLToDataViewTransitionModal &&
            !services.storage.get(ESQL_TRANSITION_MODAL_KEY)
          ) {
            state.internalState.transitions.setIsESQLToDataViewTransitionModalVisible(true);
          } else {
            state.actions.transitionFromESQLToDataView(dataView.id ?? '');
          }
        } else {
          state.actions.transitionFromDataViewToESQL(dataView);
          services.trackUiMetric?.(METRIC_TYPE.CLICK, `esql:try_btn_clicked`);
        }
      }
    },
    testId: isEsqlMode ? 'switch-to-dataviews' : 'select-text-based-language-btn',
  };

  const saveSearch = {
    id: 'save',
    label: i18n.translate('discover.localMenu.saveTitle', {
      defaultMessage: 'Save',
    }),
    description: i18n.translate('discover.localMenu.saveSearchDescription', {
      defaultMessage: 'Save Search',
    }),
    testId: 'discoverSaveButton',
    iconType: 'save',
    emphasize: true,
    run: (anchorElement: HTMLElement) => {
      onSaveSearch({
        savedSearch: state.savedSearchState.getState(),
        services,
        state,
        onClose: () => {
          anchorElement?.focus();
        },
      });
    },
  };

  const getDiscoverParams = (): AppMenuDiscoverParams => ({
    dataView,
    adHocDataViews,
    isEsqlMode,
    services,
    savedSearch: state.savedSearchState.getState(),
    savedQueryId: state.appState.getState().savedQuery,
    query: state.appState.getState().query,
    onUpdateAdHocDataViews: async (adHocDataViewList) => {
      await state.actions.loadDataViewList();
      state.internalState.transitions.setAdHocDataViews(adHocDataViewList);
    },
    onNewSearch: () => {
      services.locator.navigate({});
    },
    onOpenSavedSearch: state.actions.onOpenSavedSearch,
  });

  /* Primary items */

  const newSearch = convertMenuItem({
    appMenuItem: getNewSearchAppMenuItem(),
    getDiscoverParams,
  });

  const openSearch = convertMenuItem({
    appMenuItem: getOpenSearchAppMenuItem(),
    getDiscoverParams,
  });

  const shareSearch = convertMenuItem({
    appMenuItem: getShareAppMenuItem({ stateContainer: state, services }),
    getDiscoverParams,
  });

  /* Secondary items */

  const alerts = convertMenuItem({
    appMenuItem: getAlertsAppMenuItem({ getDiscoverParams }),
    getDiscoverParams,
  });
  // TODO: allow to extend the alerts menu

  const inspectSearch = convertMenuItem({
    appMenuItem: getInspectAppMenuItem({ onOpenInspector }),
    getDiscoverParams,
  });

  /* Custom items */
  // TODO: allow to extend with custom items

  const defaultMenu = topNavCustomization?.defaultMenu;
  const entries = [...(topNavCustomization?.getMenuItems?.() ?? [])];

  if (services.uiSettings.get(ENABLE_ESQL)) {
    entries.push({ data: esqLDataViewTransitionToggle, order: 0 });
  }

  if (!defaultMenu?.inspectItem?.disabled) {
    entries.push({ data: inspectSearch, order: defaultMenu?.inspectItem?.order ?? 100 });
  }

  if (
    services.triggersActionsUi &&
    services.capabilities.management?.insightsAndAlerting?.triggersActions &&
    !defaultMenu?.alertsItem?.disabled
  ) {
    entries.push({ data: alerts, order: defaultMenu?.alertsItem?.order ?? 200 });
  }

  if (!defaultMenu?.newItem?.disabled) {
    entries.push({ data: newSearch, order: defaultMenu?.newItem?.order ?? 300 });
  }

  if (!defaultMenu?.openItem?.disabled) {
    entries.push({ data: openSearch, order: defaultMenu?.openItem?.order ?? 400 });
  }

  if (!defaultMenu?.shareItem?.disabled) {
    entries.push({ data: shareSearch, order: defaultMenu?.shareItem?.order ?? 500 });
  }

  if (services.capabilities.discover.save && !defaultMenu?.saveItem?.disabled) {
    entries.push({ data: saveSearch, order: defaultMenu?.saveItem?.order ?? 600 });
  }

  return entries.sort((a, b) => a.order - b.order).map((entry) => entry.data);
};

function convertMenuItem({
  appMenuItem,
  getDiscoverParams,
}: {
  appMenuItem: AppMenuItem;
  getDiscoverParams: () => AppMenuDiscoverParams;
}): TopNavMenuData {
  if ('actions' in appMenuItem) {
    return {
      id: appMenuItem.id,
      label: appMenuItem.label,
      description: appMenuItem.description ?? appMenuItem.label,
      run: (anchorElement: HTMLElement) => {
        runAppMenuPopoverAction({
          appMenuItem,
          anchorElement,
          getDiscoverParams,
        });
      },
      testId: appMenuItem.testId,
    };
  }

  return {
    id: appMenuItem.id,
    label: appMenuItem.controlProps.label,
    description: appMenuItem.controlProps.description ?? appMenuItem.controlProps.label,
    run: async (anchorElement: HTMLElement) => {
      await runAppMenuAction({
        appMenuItem,
        anchorElement,
        getDiscoverParams,
      });
    },
    testId: appMenuItem.controlProps.testId,
  };
}
