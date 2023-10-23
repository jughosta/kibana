/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import type { TopNavMenuBadgeProps } from '@kbn/navigation-plugin/public';
import {
  UnsavedChangesBadge,
  type UnsavedChangesBadgeProps,
} from '../components/unsaved_changes_badge';

export interface TopNavUnsavedChangesBadgeParams {
  onReset: UnsavedChangesBadgeProps['onReset'];
  onSave?: UnsavedChangesBadgeProps['onSave'];
  onSaveAs?: UnsavedChangesBadgeProps['onSaveAs'];
}

export const getTopNavUnsavedChangesBadge = ({
  onReset,
  onSave,
  onSaveAs,
}: TopNavUnsavedChangesBadgeParams): TopNavMenuBadgeProps => {
  return {
    badgeText: i18n.translate('unsavedChangesBadge.unsavedChangesTitle', {
      defaultMessage: 'Unsaved changes',
    }),
    renderCustomBadge: ({ badgeText }) => (
      <UnsavedChangesBadge
        badgeText={badgeText}
        onReset={onReset}
        onSave={onSave}
        onSaveAs={onSaveAs}
      />
    ),
  };
};
