/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';

// Connector schema
export const GenAiConfigSchema = schema.object({
  apiProvider: schema.string(),
  apiUrl: schema.string(),
});

export const GenAiSecretsSchema = schema.object({ apiKey: schema.string() });

// Run action schema
export const GenAiRunActionParamsSchema = schema.object({
  body: schema.string(),
});

export const GenAiRunActionResponseSchema = schema.object(
  {
    id: schema.string(),
    object: schema.string(),
    created: schema.number(),
    model: schema.string(),
    usage: schema.object({
      prompt_tokens: schema.number(),
      completion_tokens: schema.number(),
      total_tokens: schema.number(),
    }),
    choices: schema.arrayOf(
      schema.object({
        message: schema.object({
          role: schema.string(),
          content: schema.string(),
        }),
        finish_reason: schema.string(),
        index: schema.number(),
      })
    ),
  },
  { unknowns: 'ignore' }
);
