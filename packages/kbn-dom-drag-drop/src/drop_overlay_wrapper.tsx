/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import classnames from 'classnames';

export interface DropOverlayWrapperProps {
  isVisible: boolean;
  className?: string;
  overlayProps?: object;
}

export const DropOverlayWrapper: React.FC<DropOverlayWrapperProps> = ({
  isVisible,
  children,
  overlayProps,
  className,
  ...otherProps
}) => {
  return (
    <div
      className={classnames('domDragDrop__dropOverlayWrapper', className)}
      {...(otherProps || {})}
    >
      {children}
      {isVisible && (
        <div
          className="domDragDrop__dropOverlay"
          data-test-subj="domDragDrop__dropOverlay"
          {...(overlayProps || {})}
        />
      )}
    </div>
  );
};
