/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import type { TopNavMenuData } from '@kbn/navigation-plugin/public';

export interface AppMenuControlOnClickParams {
  anchorElement: HTMLElement;
  onFinishAction: () => void;
}

export type AppMenuControlProps = Pick<
  TopNavMenuData,
  'testId' | 'isLoading' | 'label' | 'description' | 'disableButton' | 'href' | 'tooltip'
> & {
  onClick:
    | ((params: AppMenuControlOnClickParams) => Promise<React.ReactNode | void>)
    | ((params: AppMenuControlOnClickParams) => React.ReactNode | void)
    | undefined;
};

export type AppMenuControlIconOnlyProps = AppMenuControlProps & Pick<TopNavMenuData, 'iconType'>;

export enum AppMenuActionId {
  new = 'new',
  open = 'open',
  share = 'share',
  alerts = 'alerts',
  inspect = 'inspect',
}

export enum AppMenuActionType {
  primary = 'primary',
  secondary = 'secondary',
  custom = 'custom',
}

interface AppMenuActionBase {
  readonly id: AppMenuActionId | string;
  readonly order?: number;
}

/**
 * A normal menu action
 */
export interface AppMenuAction extends AppMenuActionBase {
  readonly type: AppMenuActionType.secondary | AppMenuActionType.custom;
  readonly controlProps: AppMenuControlProps;
}

/**
 * A menu action with icon only
 */
export interface AppMenuActionIconOnly extends AppMenuActionBase {
  readonly type: AppMenuActionType.primary;
  readonly controlProps: AppMenuControlIconOnlyProps;
}

/**
 * A menu action which opens a submenu with more actions
 */
export interface AppMenuActionSubmenu extends AppMenuActionBase {
  readonly label: TopNavMenuData['label'];
  readonly description?: TopNavMenuData['description'];
  readonly testId?: TopNavMenuData['testId'];
  readonly type: AppMenuActionType.secondary | AppMenuActionType.custom;
  readonly actions: AppMenuAction[];
}

export type AppMenuItem = AppMenuActionSubmenu | AppMenuAction | AppMenuActionIconOnly;
