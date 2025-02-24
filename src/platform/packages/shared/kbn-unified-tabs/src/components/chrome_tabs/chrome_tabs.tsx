/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useEffect, useState } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import useObservable from 'react-use/lib/useObservable';
import type { InternalChromeStart } from '@kbn/core-chrome-browser-internal';
import { UnifiedTabs, type TabItem } from '@kbn/unified-tabs';

const CHROME_TABS_LOCALSTORAGE_KEY = 'CHROME_TABS:tabs';
const CHROME_SELECTED_TAB_ID_LOCALSTORAGE_KEY = 'CHROME_TABS:selectedTabId';

let TMP_COUNTER = 0;

export interface ChromeTabsProps {
  chrome: InternalChromeStart;
}

export const ChromeTabs: React.FC<ChromeTabsProps> = ({ chrome }) => {
  const breadcrumbs$ = useObservable(chrome.getBreadcrumbs$());
  const lastBreadcrumb = breadcrumbs$?.[breadcrumbs$.length - 1];

  const [initialTab, setInitialTab] = useState<TabItem>({
    id: `${TMP_COUNTER++}`,
    label: document.title,
    href: window.location.href,
  });

  const [chromeTabs, setChromeTabs] = useLocalStorage<TabItem[]>(CHROME_TABS_LOCALSTORAGE_KEY, []);
  const [chromeSelectedTabId, setChromeSelectedTabId] = useLocalStorage<string>(
    CHROME_SELECTED_TAB_ID_LOCALSTORAGE_KEY,
    undefined
  );

  useEffect(() => {
    if (lastBreadcrumb) {
      setInitialTab((prevState) => ({
        ...prevState,
        label: document.title,
        href: window.location.href,
      }));
    }
  }, [lastBreadcrumb]);

  if (!breadcrumbs$?.length) {
    return null;
  }

  const initialItems: TabItem[] = [initialTab];

  return (
    <UnifiedTabs
      initialItems={chromeTabs?.length ? chromeTabs : initialItems}
      initialSelectedItemId={chromeSelectedTabId}
      createItem={() => {
        TMP_COUNTER += 1;
        return {
          ...initialTab,
          id: `tab_${TMP_COUNTER}`,
        };
      }}
      onChanged={(state) => {
        setChromeSelectedTabId(state.selectedItem?.id);
        setChromeTabs(state.items);
      }}
      renderContent={() => null}
    />
  );
};
