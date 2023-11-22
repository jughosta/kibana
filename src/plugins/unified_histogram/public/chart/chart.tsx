/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { ReactElement, useMemo, useState, useEffect, useCallback, memo } from 'react';
import type { Observable } from 'rxjs';
import { IconButtonGroup, type IconButtonGroupProps } from '@kbn/shared-ux-button-toolbar';
import { EuiContextMenu, EuiFlexGroup, EuiFlexItem, EuiPopover, EuiProgress } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type {
  EmbeddableComponentProps,
  Suggestion,
  LensEmbeddableOutput,
} from '@kbn/lens-plugin/public';
import { DataView, DataViewField, DataViewType } from '@kbn/data-views-plugin/public';
import type { LensEmbeddableInput } from '@kbn/lens-plugin/public';
import type { AggregateQuery, Filter, Query, TimeRange } from '@kbn/es-query';
import { Subject } from 'rxjs';
import { Histogram } from './histogram';
import { useChartPanels } from './hooks/use_chart_panels';
import type {
  UnifiedHistogramBreakdownContext,
  UnifiedHistogramChartContext,
  UnifiedHistogramFetchStatus,
  UnifiedHistogramHitsContext,
  UnifiedHistogramChartLoadEvent,
  UnifiedHistogramRequestContext,
  UnifiedHistogramServices,
  UnifiedHistogramInput$,
  UnifiedHistogramInputMessage,
} from '../types';
import { BreakdownFieldSelector } from './breakdown_field_selector';
import { SuggestionSelector } from './suggestion_selector';
import { useTotalHits } from './hooks/use_total_hits';
import { useRequestParams } from './hooks/use_request_params';
import { useChartStyles } from './hooks/use_chart_styles';
import { useChartActions } from './hooks/use_chart_actions';
import { ChartConfigPanel } from './chart_config_panel';
import { getLensAttributes } from './utils/get_lens_attributes';
import { useRefetch } from './hooks/use_refetch';
import { useEditVisualization } from './hooks/use_edit_visualization';

export interface ChartProps {
  className?: string;
  services: UnifiedHistogramServices;
  dataView: DataView;
  query?: Query | AggregateQuery;
  filters?: Filter[];
  isPlainRecord?: boolean;
  currentSuggestion?: Suggestion;
  allSuggestions?: Suggestion[];
  timeRange?: TimeRange;
  relativeTimeRange?: TimeRange;
  request?: UnifiedHistogramRequestContext;
  hits?: UnifiedHistogramHitsContext;
  chart?: UnifiedHistogramChartContext;
  breakdown?: UnifiedHistogramBreakdownContext;
  appendHistogram?: ReactElement;
  disableAutoFetching?: boolean;
  disableTriggers?: LensEmbeddableInput['disableTriggers'];
  disabledActions?: LensEmbeddableInput['disabledActions'];
  input$?: UnifiedHistogramInput$;
  lensAdapters?: UnifiedHistogramChartLoadEvent['adapters'];
  lensEmbeddableOutput$?: Observable<LensEmbeddableOutput>;
  isOnHistogramMode?: boolean;
  isChartLoading?: boolean;
  onResetChartHeight?: () => void;
  onChartHiddenChange?: (chartHidden: boolean) => void;
  onTimeIntervalChange?: (timeInterval: string) => void;
  onBreakdownFieldChange?: (breakdownField: DataViewField | undefined) => void;
  onSuggestionChange?: (suggestion: Suggestion | undefined) => void;
  onTotalHitsChange?: (status: UnifiedHistogramFetchStatus, result?: number | Error) => void;
  onChartLoad?: (event: UnifiedHistogramChartLoadEvent) => void;
  onFilter?: LensEmbeddableInput['onFilter'];
  onBrushEnd?: LensEmbeddableInput['onBrushEnd'];
  withDefaultActions: EmbeddableComponentProps['withDefaultActions'];
}

const HistogramMemoized = memo(Histogram);

export function Chart({
  className,
  services,
  dataView,
  query: originalQuery,
  filters: originalFilters,
  timeRange: originalTimeRange,
  relativeTimeRange: originalRelativeTimeRange,
  request,
  hits,
  chart,
  breakdown,
  currentSuggestion,
  allSuggestions,
  isPlainRecord,
  appendHistogram,
  disableAutoFetching,
  disableTriggers,
  disabledActions,
  input$: originalInput$,
  lensAdapters,
  lensEmbeddableOutput$,
  isOnHistogramMode,
  isChartLoading,
  onResetChartHeight,
  onChartHiddenChange,
  onTimeIntervalChange,
  onSuggestionChange,
  onBreakdownFieldChange,
  onTotalHitsChange,
  onChartLoad,
  onFilter,
  onBrushEnd,
  withDefaultActions,
}: ChartProps) {
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const {
    showChartOptionsPopover,
    chartRef,
    toggleChartOptions,
    closeChartOptions,
    toggleHideChart,
  } = useChartActions({
    chart,
    onChartHiddenChange,
  });

  const panels = useChartPanels({
    chart,
    toggleHideChart,
    onTimeIntervalChange,
    closePopover: closeChartOptions,
    onResetChartHeight,
    isPlainRecord,
  });

  const chartVisible = !!(
    chart &&
    !chart.hidden &&
    dataView.id &&
    dataView.type !== DataViewType.ROLLUP &&
    (isPlainRecord || (!isPlainRecord && dataView.isTimeBased()))
  );

  const input$ = useMemo(
    () => originalInput$ ?? new Subject<UnifiedHistogramInputMessage>(),
    [originalInput$]
  );

  const { filters, query, getTimeRange, updateTimeRange, relativeTimeRange } = useRequestParams({
    services,
    query: originalQuery,
    filters: originalFilters,
    timeRange: originalTimeRange,
  });

  const refetch$ = useRefetch({
    dataView,
    request,
    hits,
    chart,
    chartVisible,
    breakdown,
    filters,
    query,
    relativeTimeRange,
    currentSuggestion,
    disableAutoFetching,
    input$,
    beforeRefetch: updateTimeRange,
  });

  useTotalHits({
    services,
    dataView,
    request,
    hits,
    chartVisible,
    filters,
    query,
    getTimeRange,
    refetch$,
    onTotalHitsChange,
    isPlainRecord,
  });

  const {
    resultCountCss,
    resultCountInnerCss,
    resultCountToggleCss,
    histogramCss,
    breakdownFieldSelectorGroupCss,
    breakdownFieldSelectorItemCss,
    suggestionsSelectorItemCss,
    chartToolButtonCss,
  } = useChartStyles(chartVisible);

  const lensAttributesContext = useMemo(
    () =>
      getLensAttributes({
        title: chart?.title,
        filters,
        query,
        dataView,
        timeInterval: chart?.timeInterval,
        breakdownField: breakdown?.field,
        suggestion: currentSuggestion,
      }),
    [
      breakdown?.field,
      chart?.timeInterval,
      chart?.title,
      currentSuggestion,
      dataView,
      filters,
      query,
    ]
  );

  const onSuggestionSelectorChange = useCallback(
    (s: Suggestion | undefined) => {
      onSuggestionChange?.(s);
    },
    [onSuggestionChange]
  );

  useEffect(() => {
    // close the flyout for dataview mode
    // or if no chart is visible
    if (!chartVisible && isFlyoutVisible) {
      setIsFlyoutVisible(false);
    }
  }, [chartVisible, isFlyoutVisible]);

  const onEditVisualization = useEditVisualization({
    services,
    dataView,
    relativeTimeRange: originalRelativeTimeRange ?? relativeTimeRange,
    lensAttributes: lensAttributesContext.attributes,
    isPlainRecord,
  });

  if (!chart || !chartVisible) {
    return <div data-test-subj="unifiedHistogramChartEmpty" />;
  }

  const LensSaveModalComponent = services.lens.SaveModalComponent;
  const canSaveVisualization =
    chartVisible && currentSuggestion && services.capabilities.dashboard?.showWriteControls;
  const canEditVisualizationOnTheFly = currentSuggestion && chartVisible;

  const actions: IconButtonGroupProps['buttons'] = [];

  if (canEditVisualizationOnTheFly) {
    actions.push({
      label: i18n.translate('unifiedHistogram.editVisualizationButton', {
        defaultMessage: 'Edit visualization',
      }),
      iconType: 'pencil',
      isDisabled: isFlyoutVisible,
      'data-test-subj': 'unifiedHistogramEditVisualizationOnTheFly',
      onClick: () => setIsFlyoutVisible(true),
    });
  } else if (onEditVisualization) {
    actions.push({
      label: i18n.translate('unifiedHistogram.editVisualizationButton', {
        defaultMessage: 'Edit visualization',
      }),
      iconType: 'lensApp',
      'data-test-subj': 'unifiedHistogramEditVisualization',
      onClick: onEditVisualization,
    });
  }
  if (canSaveVisualization) {
    actions.push({
      label: i18n.translate('unifiedHistogram.saveVisualizationButton', {
        defaultMessage: 'Save visualization',
      }),
      iconType: 'save',
      'data-test-subj': 'unifiedHistogramSaveVisualization',
      onClick: () => setIsSaveModalVisible(true),
    });
  }

  return (
    <EuiFlexGroup
      className={className}
      direction="column"
      alignItems="stretch"
      gutterSize="none"
      responsive={false}
    >
      <EuiFlexItem grow={false} css={resultCountCss}>
        <EuiFlexGroup
          justifyContent="spaceBetween"
          alignItems="center"
          gutterSize="none"
          responsive={false}
          css={resultCountInnerCss}
        >
          {chart && (
            <EuiFlexItem css={resultCountToggleCss}>
              <EuiFlexGroup
                direction="row"
                gutterSize="none"
                responsive={false}
                justifyContent="flexEnd"
                css={breakdownFieldSelectorGroupCss}
              >
                <EuiFlexItem grow={false}>
                  <IconButtonGroup
                    legend={i18n.translate('unifiedHistogram.hideChartButtongroupLegend', {
                      defaultMessage: 'Hide chart',
                    })}
                    buttonSize="s"
                    buttons={[
                      {
                        label: i18n.translate('unifiedHistogram.hideChartButton', {
                          defaultMessage: 'Hide chart',
                        }),
                        iconType: 'transitionTopOut',
                        'data-test-subj': 'unifiedHistogramHideChartButton',
                        onClick: toggleHideChart,
                      },
                    ]}
                  />
                </EuiFlexItem>
                {chartVisible && breakdown && (
                  <EuiFlexItem css={breakdownFieldSelectorItemCss}>
                    <BreakdownFieldSelector
                      dataView={dataView}
                      breakdown={breakdown}
                      onBreakdownFieldChange={onBreakdownFieldChange}
                    />
                  </EuiFlexItem>
                )}
                {chartVisible && currentSuggestion && allSuggestions && allSuggestions?.length > 1 && (
                  <EuiFlexItem css={suggestionsSelectorItemCss}>
                    <SuggestionSelector
                      suggestions={allSuggestions}
                      activeSuggestion={currentSuggestion}
                      onSuggestionChange={onSuggestionSelectorChange}
                    />
                  </EuiFlexItem>
                )}
                {actions.length > 0 && (
                  <EuiFlexItem grow={false} css={chartToolButtonCss}>
                    <IconButtonGroup
                      legend={i18n.translate('unifiedHistogram.chartActionsGroupLegend', {
                        defaultMessage: 'Chart actions',
                      })}
                      buttonSize="s"
                      buttons={actions}
                    />
                  </EuiFlexItem>
                )}
                <EuiFlexItem grow={false} css={chartToolButtonCss}>
                  <EuiPopover
                    id="unifiedHistogramChartOptions"
                    button={
                      <IconButtonGroup
                        legend={i18n.translate('unifiedHistogram.chartOptionsButton', {
                          defaultMessage: 'Chart options',
                        })}
                        buttonSize="s"
                        buttons={[
                          {
                            label: i18n.translate('unifiedHistogram.chartOptionsButton', {
                              defaultMessage: 'Chart options',
                            }),
                            iconType: 'gear',
                            'data-test-subj': 'unifiedHistogramChartOptionsToggle',
                            onClick: toggleChartOptions,
                          },
                        ]}
                      />
                    }
                    isOpen={showChartOptionsPopover}
                    closePopover={closeChartOptions}
                    panelPaddingSize="none"
                    anchorPosition="downLeft"
                  >
                    <EuiContextMenu initialPanelId={0} panels={panels} />
                  </EuiPopover>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
      {chartVisible && (
        <EuiFlexItem>
          <section
            ref={(element) => (chartRef.current.element = element)}
            tabIndex={-1}
            aria-label={i18n.translate('unifiedHistogram.histogramOfFoundDocumentsAriaLabel', {
              defaultMessage: 'Histogram of found documents',
            })}
            css={histogramCss}
          >
            {isChartLoading && (
              <EuiProgress
                size="xs"
                color="accent"
                position="absolute"
                data-test-subj="unifiedHistogramProgressBar"
              />
            )}
            <HistogramMemoized
              services={services}
              dataView={dataView}
              request={request}
              hits={hits}
              chart={chart}
              getTimeRange={getTimeRange}
              refetch$={refetch$}
              lensAttributesContext={lensAttributesContext}
              isPlainRecord={isPlainRecord}
              disableTriggers={disableTriggers}
              disabledActions={disabledActions}
              onTotalHitsChange={onTotalHitsChange}
              hasLensSuggestions={!Boolean(isOnHistogramMode)}
              onChartLoad={onChartLoad}
              onFilter={onFilter}
              onBrushEnd={onBrushEnd}
              withDefaultActions={withDefaultActions}
            />
          </section>
          {appendHistogram}
        </EuiFlexItem>
      )}
      {canSaveVisualization && isSaveModalVisible && lensAttributesContext.attributes && (
        <LensSaveModalComponent
          initialInput={lensAttributesContext.attributes as unknown as LensEmbeddableInput}
          onSave={() => {}}
          onClose={() => setIsSaveModalVisible(false)}
          isSaveable={false}
        />
      )}
      {isFlyoutVisible && (
        <ChartConfigPanel
          {...{
            services,
            lensAttributesContext,
            lensAdapters,
            lensEmbeddableOutput$,
            currentSuggestion,
            isFlyoutVisible,
            setIsFlyoutVisible,
            isPlainRecord,
            query: originalQuery,
            onSuggestionChange,
          }}
        />
      )}
    </EuiFlexGroup>
  );
}
