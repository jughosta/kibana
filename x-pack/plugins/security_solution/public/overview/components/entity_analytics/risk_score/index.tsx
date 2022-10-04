/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

import { useDispatch } from 'react-redux';
import { EntityAnalyticsUserRiskScoreDisable } from '../../../../common/components/risk_score/risk_score_disabled/user_risk_score.disabled';
import { getTabsOnUsersUrl } from '../../../../common/components/link_to/redirect_to_users';
import { UsersTableType } from '../../../../users/store/model';
import { RiskScoresDeprecated } from '../../../../common/components/risk_score/risk_score_deprecated';
import { SeverityFilterGroup } from '../../../../common/components/severity/severity_filter_group';
import { LinkButton, useGetSecuritySolutionLinkProps } from '../../../../common/components/links';
import { getTabsOnHostsUrl } from '../../../../common/components/link_to/redirect_to_hosts';
import { HostsTableType, HostsType } from '../../../../hosts/store/model';
import { getRiskScoreColumns } from './columns';
import { LastUpdatedAt } from '../../../../common/components/last_updated_at';
import { HeaderSection } from '../../../../common/components/header_section';
import {
  useHostRiskScore,
  useHostRiskScoreKpi,
  useUserRiskScore,
  useUserRiskScoreKpi,
} from '../../../../risk_score/containers';

import type { RiskSeverity } from '../../../../../common/search_strategy';
import { EMPTY_SEVERITY_COUNT, RiskScoreEntity } from '../../../../../common/search_strategy';
import { SecurityPageName } from '../../../../app/types';
import * as i18n from './translations';
import { generateSeverityFilter } from '../../../../hosts/store/helpers';
import { useQueryInspector } from '../../../../common/components/page/manage_query';
import { useGlobalTime } from '../../../../common/containers/use_global_time';
import { InspectButtonContainer } from '../../../../common/components/inspect';
import { useQueryToggle } from '../../../../common/containers/query_toggle';
import { hostsActions } from '../../../../hosts/store';
import { RiskScoreDonutChart } from '../common/risk_score_donut_chart';
import { BasicTableWithoutBorderBottom } from '../common/basic_table_without_border_bottom';
import { RISKY_HOSTS_DOC_LINK, RISKY_USERS_DOC_LINK } from '../../../../../common/constants';
import { EntityAnalyticsHostRiskScoreDisable } from '../../../../common/components/risk_score/risk_score_disabled/host_risk_score_disabled';
import { RiskScoreHeaderTitle } from '../../../../common/components/risk_score/risk_score_onboarding/risk_score_header_title';
import { RiskScoresNoDataDetected } from '../../../../common/components/risk_score/risk_score_onboarding/risk_score_no_data_detected';
import { useRefetchQueries } from '../../../../common/hooks/use_refetch_queries';
import { Loader } from '../../../../common/components/loader';
import { Panel } from '../../../../common/components/panel';
import * as commonI18n from '../common/translations';
import { usersActions } from '../../../../users/store';

const TABLE_QUERY_ID = (riskEntity: RiskScoreEntity) =>
  riskEntity === RiskScoreEntity.host ? 'hostRiskDashboardTable' : 'userRiskDashboardTable';
const RISK_KPI_QUERY_ID = (riskEntity: RiskScoreEntity) =>
  riskEntity === RiskScoreEntity.host
    ? 'headerHostRiskScoreKpiQuery'
    : 'headerUserRiskScoreKpiQuery';

const EntityAnalyticsRiskScoresComponent = ({ riskEntity }: { riskEntity: RiskScoreEntity }) => {
  const { deleteQuery, setQuery, from, to } = useGlobalTime();
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());
  const dispatch = useDispatch();

  const entity = useMemo(
    () =>
      riskEntity === RiskScoreEntity.host
        ? {
            docLink: RISKY_HOSTS_DOC_LINK,
            kpiHook: useHostRiskScoreKpi,
            riskScoreHook: useHostRiskScore,
            linkProps: {
              deepLinkId: SecurityPageName.hosts,
              path: getTabsOnHostsUrl(HostsTableType.risk),
              onClick: () => {
                dispatch(
                  hostsActions.updateHostRiskScoreSeverityFilter({
                    severitySelection: [],
                    hostsType: HostsType.page,
                  })
                );
              },
            },
          }
        : {
            docLink: RISKY_USERS_DOC_LINK,
            kpiHook: useUserRiskScoreKpi,
            riskScoreHook: useUserRiskScore,
            linkProps: {
              deepLinkId: SecurityPageName.users,
              path: getTabsOnUsersUrl(UsersTableType.risk),
              onClick: () => {
                dispatch(
                  usersActions.updateUserRiskScoreSeverityFilter({
                    severitySelection: [],
                  })
                );
              },
            },
          },
    [dispatch, riskEntity]
  );

  const { toggleStatus, setToggleStatus } = useQueryToggle(TABLE_QUERY_ID(riskEntity));
  const columns = useMemo(() => getRiskScoreColumns(riskEntity), [riskEntity]);
  const [selectedSeverity, setSelectedSeverity] = useState<RiskSeverity[]>([]);
  const getSecuritySolutionLinkProps = useGetSecuritySolutionLinkProps();

  const severityFilter = useMemo(() => {
    const [filter] = generateSeverityFilter(selectedSeverity, riskEntity);

    return filter ? JSON.stringify(filter.query) : undefined;
  }, [riskEntity, selectedSeverity]);

  const timerange = useMemo(
    () => ({
      from,
      to,
    }),
    [from, to]
  );

  const {
    severityCount,
    loading: isKpiLoading,
    refetch: refetchKpi,
    inspect: inspectKpi,
  } = entity.kpiHook({
    filterQuery: severityFilter,
    skip: !toggleStatus,
    timerange,
  });

  useQueryInspector({
    queryId: RISK_KPI_QUERY_ID(riskEntity),
    loading: isKpiLoading,
    refetch: refetchKpi,
    setQuery,
    deleteQuery,
    inspect: inspectKpi,
  });
  const [
    isTableLoading,
    { data, inspect, refetch, isDeprecated, isLicenseValid, isModuleEnabled },
  ] = entity.riskScoreHook({
    filterQuery: severityFilter,
    skip: !toggleStatus,
    pagination: {
      cursorStart: 0,
      querySize: 5,
    },
    timerange,
  });

  useQueryInspector({
    queryId: TABLE_QUERY_ID(riskEntity),
    loading: isTableLoading,
    refetch,
    setQuery,
    deleteQuery,
    inspect,
  });

  useEffect(() => {
    setUpdatedAt(Date.now());
  }, [isTableLoading, isKpiLoading]); // Update the time when data loads

  const [goToEntityRiskTab, entityRiskTabUrl] = useMemo(() => {
    const { onClick, href } = getSecuritySolutionLinkProps(entity.linkProps);
    return [onClick, href];
  }, [entity.linkProps, getSecuritySolutionLinkProps]);

  const refreshPage = useRefetchQueries();

  if (!isLicenseValid) {
    return null;
  }

  if (!isModuleEnabled && !isTableLoading) {
    return riskEntity === RiskScoreEntity.host ? (
      <EntityAnalyticsHostRiskScoreDisable refetch={refreshPage} timerange={timerange} />
    ) : (
      <EntityAnalyticsUserRiskScoreDisable refetch={refreshPage} timerange={timerange} />
    );
  }

  if (isDeprecated && !isTableLoading) {
    return (
      <RiskScoresDeprecated entityType={riskEntity} refetch={refreshPage} timerange={timerange} />
    );
  }

  if (isModuleEnabled && selectedSeverity.length === 0 && data && data.length === 0) {
    return <RiskScoresNoDataDetected entityType={riskEntity} refetch={refreshPage} />;
  }

  return (
    <InspectButtonContainer>
      <Panel hasBorder data-test-subj={`entity_analytics_${riskEntity}s`}>
        <HeaderSection
          title={<RiskScoreHeaderTitle riskScoreEntity={riskEntity} />}
          titleSize="s"
          subtitle={
            <LastUpdatedAt isUpdating={isTableLoading || isKpiLoading} updatedAt={updatedAt} />
          }
          id={TABLE_QUERY_ID(riskEntity)}
          toggleStatus={toggleStatus}
          toggleQuery={setToggleStatus}
          tooltip={commonI18n.HOST_RISK_TABLE_TOOLTIP}
        >
          {toggleStatus && (
            <EuiFlexGroup alignItems="center" gutterSize="m">
              <EuiFlexItem>
                <EuiButtonEmpty
                  rel="noopener nofollow noreferrer"
                  href={entity.docLink}
                  target="_blank"
                >
                  {i18n.LEARN_MORE}
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <SeverityFilterGroup
                  selectedSeverities={selectedSeverity}
                  severityCount={severityCount ?? EMPTY_SEVERITY_COUNT}
                  title={i18n.ENTITY_RISK(riskEntity)}
                  onSelect={setSelectedSeverity}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <LinkButton
                  data-test-subj="view-all-button"
                  onClick={goToEntityRiskTab}
                  href={entityRiskTabUrl}
                >
                  {i18n.VIEW_ALL}
                </LinkButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </HeaderSection>
        {toggleStatus && (
          <EuiFlexGroup data-test-subj="entity_analytics_content">
            <EuiFlexItem grow={false}>
              <RiskScoreDonutChart severityCount={severityCount ?? EMPTY_SEVERITY_COUNT} />
            </EuiFlexItem>
            <EuiFlexItem>
              <BasicTableWithoutBorderBottom
                responsive={false}
                items={data ?? []}
                columns={columns}
                loading={isTableLoading}
                id={TABLE_QUERY_ID(riskEntity)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
        {(isTableLoading || isKpiLoading) && (
          <Loader data-test-subj="loadingPanelRiskScore" overlay size="xl" />
        )}
      </Panel>
    </InspectButtonContainer>
  );
};

export const EntityAnalyticsRiskScores = React.memo(EntityAnalyticsRiskScoresComponent);
EntityAnalyticsRiskScores.displayName = 'EntityAnalyticsRiskScores';
