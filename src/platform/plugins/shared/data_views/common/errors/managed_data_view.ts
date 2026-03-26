/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/**
 * Error thrown when attempting to modify a managed data view.
 * @public
 */
export class ManagedDataViewError extends Error {
  /**
   * constructor
   * @param savedObjectId - Saved object id of data view for display in error message
   */
  constructor(savedObjectId?: string) {
    super(
      `Cannot modify managed data view${
        savedObjectId ? `, id: ${savedObjectId}` : ''
      }. Duplicate the data view and make changes to the copy instead.`
    );
    this.name = 'ManagedDataViewError';
  }
}
