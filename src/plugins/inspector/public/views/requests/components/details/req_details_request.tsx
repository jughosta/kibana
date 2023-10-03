/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { Component } from 'react';
import { Request } from '../../../../../common/adapters/request/types';
import { DetailViewProps } from './types';
import { RequestCodeViewer } from './req_code_viewer';

export class RequestDetailsRequest extends Component<DetailViewProps> {
  static shouldShow = (request: Request) => Boolean(request && request.json);

  render() {
    const { json } = this.props.request;

    if (!json) {
      return null;
    }

    return (
      <RequestCodeViewer
        indexPattern={this.props.request.stats?.indexPattern?.value}
        json={JSON.stringify(json, null, 2)}
      />
    );
  }
}
