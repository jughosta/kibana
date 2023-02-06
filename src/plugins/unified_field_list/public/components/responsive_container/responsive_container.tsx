/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonProps,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiHideFor,
  EuiIcon,
  EuiLink,
  EuiPortal,
  EuiShowFor,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';

export interface ResponsiveContainerProps {
  badgeCount: number;
  isCollapsed?: boolean; // whether a collapsible panel is used to wrap the field list
  mobileButtonProps?: Omit<EuiButtonProps, 'fullWidth' | 'onClick'>;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  badgeCount,
  isCollapsed,
  mobileButtonProps,
}) => {
  const { euiTheme } = useEuiTheme();
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);

  return (
    <>
      {!isCollapsed && <EuiHideFor sizes={['xs', 's']}>{children}</EuiHideFor>}
      <EuiShowFor sizes={['xs', 's']}>
        <div
          css={css`
            width: 100%;
            padding: ${euiTheme.size.s} ${euiTheme.size.s} 0;
          `}
        >
          <EuiButton {...mobileButtonProps} fullWidth onClick={() => setIsFlyoutVisible(true)}>
            <FormattedMessage
              id="unifiedFieldList.fieldsMobileButtonLabel"
              defaultMessage="Fields"
            />
            <EuiBadge
              css={css`
                margin-left: ${euiTheme.size.s};
                vertical-align: text-bottom;
              `}
              color={badgeCount === 0 ? 'default' : 'accent'}
            >
              {badgeCount}
            </EuiBadge>
          </EuiButton>
        </div>
        {isFlyoutVisible && (
          <EuiPortal>
            <EuiFlyout
              size="s"
              onClose={() => setIsFlyoutVisible(false)}
              aria-labelledby="flyoutTitle"
              ownFocus
            >
              <EuiFlyoutHeader hasBorder>
                <EuiTitle size="s">
                  <h2 id="flyoutTitle">
                    <EuiLink color="text" onClick={() => setIsFlyoutVisible(false)}>
                      <EuiIcon
                        className="eui-alignBaseline"
                        aria-label={i18n.translate('unifiedFieldList.fieldsFlyout.backButton', {
                          defaultMessage: 'Back',
                        })}
                        type="arrowLeft"
                      />{' '}
                      <strong>
                        {i18n.translate('unifiedFieldList.fieldsFlyout.flyoutHeading', {
                          defaultMessage: 'Field list',
                        })}
                      </strong>
                    </EuiLink>
                  </h2>
                </EuiTitle>
              </EuiFlyoutHeader>
              {children}
            </EuiFlyout>
          </EuiPortal>
        )}
      </EuiShowFor>
    </>
  );
};
