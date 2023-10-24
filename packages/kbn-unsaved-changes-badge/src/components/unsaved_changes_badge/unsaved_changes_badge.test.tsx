/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/dom';
import { render, act } from '@testing-library/react';
import { UnsavedChangesBadge } from './unsaved_changes_badge';

describe('<UnsavedChangesBadge />', () => {
  test('should render correctly', async () => {
    const onReset = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <UnsavedChangesBadge badgeText="test" onReset={onReset} />
    );
    expect(getByTestId('unsavedChangesBadge')).toBeInTheDocument();

    getByTestId('unsavedChangesBadge').click();
    await waitFor(() => {
      return Boolean(queryByTestId('unsavedChangesBadgeMenuPanel'));
    });
    expect(queryByTestId('resetUnsavedChangesMenuItem')).toBeInTheDocument();
    expect(queryByTestId('saveUnsavedChangesMenuItem')).not.toBeInTheDocument();
    expect(queryByTestId('saveUnsavedChangesAsMenuItem')).not.toBeInTheDocument();

    expect(onReset).not.toHaveBeenCalled();

    act(() => {
      getByTestId('resetUnsavedChangesMenuItem').click();
    });
    expect(onReset).toHaveBeenCalled();
  });

  test('should show all menu items', async () => {
    const onReset = jest.fn().mockResolvedValue(true);
    const onSave = jest.fn().mockResolvedValue(true);
    const onSaveAs = jest.fn().mockResolvedValue(true);
    const { getByTestId, queryByTestId, container } = render(
      <UnsavedChangesBadge badgeText="test" onReset={onReset} onSave={onSave} onSaveAs={onSaveAs} />
    );

    expect(container).toMatchSnapshot();

    getByTestId('unsavedChangesBadge').click();
    await waitFor(() => {
      return Boolean(queryByTestId('unsavedChangesBadgeMenuPanel'));
    });
    expect(queryByTestId('resetUnsavedChangesMenuItem')).toBeInTheDocument();
    expect(queryByTestId('saveUnsavedChangesMenuItem')).toBeInTheDocument();
    expect(queryByTestId('saveUnsavedChangesAsMenuItem')).toBeInTheDocument();

    expect(screen.getByTestId('unsavedChangesBadgeMenuPanel')).toMatchSnapshot();
  });

  test('should call callbacks', async () => {
    const onReset = jest.fn().mockResolvedValue(true);
    const onSave = jest.fn().mockResolvedValue(true);
    const onSaveAs = jest.fn().mockResolvedValue(true);
    const { getByTestId, queryByTestId } = render(
      <UnsavedChangesBadge badgeText="test" onReset={onReset} onSave={onSave} onSaveAs={onSaveAs} />
    );
    act(() => {
      getByTestId('unsavedChangesBadge').click();
    });
    await waitFor(() => {
      return Boolean(queryByTestId('unsavedChangesBadgeMenuPanel'));
    });

    expect(onSave).not.toHaveBeenCalled();

    act(() => {
      getByTestId('saveUnsavedChangesMenuItem').click();
    });
    expect(onSave).toHaveBeenCalled();
  });
});
