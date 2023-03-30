/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useState, useMemo, useContext } from 'react';
import classNames from 'classnames';
import { DEFAULT_DATA_TEST_SUBJ, REORDER_ITEM_HEIGHT } from '../constants';

/**
 * Reorder state
 */
export interface ReorderState {
  /**
   * Ids of the elements that are translated up or down
   */
  reorderedItems: Array<{ id: string; height?: number }>;

  /**
   * Direction of the move of dragged element in the reordered list
   */
  direction: '-' | '+';
  /**
   * height of the dragged element
   */
  draggingHeight: number;
  /**
   * indicates that user is in keyboard mode
   */
  isReorderOn: boolean;
  /**
   * reorder group needed for screen reader aria-described-by attribute
   */
  groupId: string;
}

type SetReorderStateDispatch = (prevState: ReorderState) => ReorderState;

/**
 * Reorder context state
 */
export interface ReorderContextState {
  reorderState: ReorderState;
  setReorderState: (dispatch: SetReorderStateDispatch) => void;
}

/**
 * Reorder context
 */
export const ReorderContext = React.createContext<ReorderContextState>({
  reorderState: {
    reorderedItems: [],
    direction: '-',
    draggingHeight: REORDER_ITEM_HEIGHT,
    isReorderOn: false,
    groupId: '',
  },
  setReorderState: () => () => {},
});

/**
 * Reorder context state for multiple groups at once
 */
export interface MultiGroupReorderContextState {
  groupsReorderState: Record<string, ReorderState>;
  setGroupReorderState: (groupId: string, dispatch: SetReorderStateDispatch) => void;
  draggingHeight: number;
}

/**
 * Reorder context for multiple groups at once
 */
export const MultiGroupReorderContext = React.createContext<MultiGroupReorderContextState>({
  groupsReorderState: {},
  setGroupReorderState: () => () => {},
  draggingHeight: REORDER_ITEM_HEIGHT,
});

/**
 * To create a reordering group, surround the elements from the same group with a `GroupReorderProvider`
 * @param id
 * @param children
 * @param className
 * @param draggingHeight
 * @param dataTestSubj
 * @constructor
 */
export function GroupReorderProvider({
  id,
  children,
  className,
  draggingHeight = REORDER_ITEM_HEIGHT,
  dataTestSubj = DEFAULT_DATA_TEST_SUBJ,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  draggingHeight?: number;
  dataTestSubj?: string;
}) {
  const [state, setState] = useState<ReorderContextState['reorderState']>(() =>
    getInitialReorderState(id, draggingHeight)
  );

  const setReorderState = useMemo(
    () => (dispatch: SetReorderStateDispatch) => {
      setState(dispatch);
    },
    [setState]
  );

  const reorderStateValue = useMemo(
    () => ({ reorderState: state, setReorderState }),
    [state, setReorderState]
  );

  return (
    <ChildGroupReorderProvider
      reorderStateValue={reorderStateValue}
      className={className}
      dataTestSubj={dataTestSubj}
    >
      {children}
    </ChildGroupReorderProvider>
  );
}

/**
 * Can be used to pass down provider's value
 * @param reorderStateValue
 * @param children
 * @param className
 * @param dataTestSubj
 * @constructor
 */
export function ChildGroupReorderProvider({
  reorderStateValue,
  children,
  className,
  dataTestSubj = DEFAULT_DATA_TEST_SUBJ,
}: {
  reorderStateValue: ReorderContextState;
  children: React.ReactNode;
  className?: string;
  dataTestSubj?: string;
}) {
  return (
    <div
      data-test-subj={`${dataTestSubj}-reorderableGroup`}
      className={classNames(className, {
        'domDragDrop-isActiveGroup':
          reorderStateValue.reorderState.isReorderOn && React.Children.count(children) > 1,
      })}
    >
      <ReorderContext.Provider value={reorderStateValue}>{children}</ReorderContext.Provider>
    </div>
  );
}

/**
 * Root provider which can work with multiple `ChildGroupReorderProvider`s
 * @param id
 * @param children
 * @param draggingHeight
 * @constructor
 */
export function MultiGroupReorderProvider({
  groupIds,
  children,
  draggingHeight = REORDER_ITEM_HEIGHT,
}: {
  groupIds: string[];
  children: React.ReactNode;
  draggingHeight?: number;
}) {
  const [groupsReorderState, setGroupsState] = useState<
    MultiGroupReorderContextState['groupsReorderState']
  >(() => {
    return groupIds.reduce((state, groupId) => {
      // @ts-ignore
      state[groupId] = {
        reorderedItems: [],
        direction: '-',
        draggingHeight,
        isReorderOn: false,
        groupId,
      };
      return state;
    }, {});
  });

  const setGroupReorderState = useMemo(
    () => (groupId: string, dispatch: SetReorderStateDispatch) => {
      setGroupsState((state) => ({
        ...state,
        [groupId]: dispatch(state[groupId]),
      }));
    },
    [setGroupsState]
  );

  const reorderGroupsStateValue: MultiGroupReorderContextState = useMemo(
    () => ({ groupsReorderState, setGroupReorderState, draggingHeight }),
    [groupsReorderState, setGroupReorderState, draggingHeight]
  );

  return (
    <MultiGroupReorderContext.Provider value={reorderGroupsStateValue}>
      {children}
    </MultiGroupReorderContext.Provider>
  );
}

/**
 * Can be used to pass down provider's value
 * @param reorderStateValue
 * @param children
 * @param className
 * @param dataTestSubj
 * @constructor
 */
export function MultiGroupChildReorderProvider({
  groupId,
  children,
  className,
  dataTestSubj = DEFAULT_DATA_TEST_SUBJ,
}: {
  groupId: string;
  children: React.ReactNode;
  className?: string;
  dataTestSubj?: string;
}) {
  const groupsReorderStateValue = useContext(MultiGroupReorderContext);

  const reorderStateValue: ReorderContextState = useMemo(
    () => ({
      reorderState: groupsReorderStateValue.groupsReorderState[groupId],
      setReorderState: (dispatch) =>
        groupsReorderStateValue.setGroupReorderState(groupId, dispatch),
    }),
    [groupsReorderStateValue, groupId]
  );

  return (
    <ChildGroupReorderProvider
      reorderStateValue={reorderStateValue}
      className={className}
      dataTestSubj={dataTestSubj}
    >
      {children}
    </ChildGroupReorderProvider>
  );
}

function getInitialReorderState(groupId: string, draggingHeight: number): ReorderState {
  return {
    reorderedItems: [],
    direction: '-',
    draggingHeight,
    isReorderOn: false,
    groupId,
  };
}
