/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  REVIEW_RULE_UPGRADE_URL,
  ReviewRuleUpgradeResponseBody,
} from '@kbn/security-solution-plugin/common/detection_engine/prebuilt_rules';
import type SuperTest from 'supertest';

/**
 * Returns prebuilt rules that are available to Upgrade
 *
 * @param supertest SuperTest instance
 * @returns Review Upgrade prebuilt rules response
 */
export const reviewPrebuiltRulesToUpgrade = async (
  supertest: SuperTest.SuperTest<SuperTest.Test>
): Promise<ReviewRuleUpgradeResponseBody> => {
  const response = await supertest
    .post(REVIEW_RULE_UPGRADE_URL)
    .set('kbn-xsrf', 'true')
    .send()
    .expect(200);

  return response.body;
};
