/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { copyToClipboard, EuiListGroupItemProps } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';

export function buildCopyColumnValueButton(columnValue: string) {
  const copyToClipBoardButton: EuiListGroupItemProps = {
    size: 'xs',
    label: (
      <FormattedMessage
        id="discover.grid.copyColumnValueToClipBoardButton"
        defaultMessage="Copy column"
      />
    ),
    iconType: 'copyClipboard',
    iconProps: { size: 'm' },
    onClick: () => copyToClipboard(columnValue),
  };

  return copyToClipBoardButton;
}
