import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { EDAResponse } from '../types';
import { DynamicChart } from '../components/DynamicChart';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import { BarChart3, TrendingUp, Grid, PieChart } from 'lucide-react';

export const EDA: React.FC<{ isDark: boolean; onLoadDefault: () => void }> = ({ isDark, onLoadDefault }) => {
  const [data, setData] = useState<EDAResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDistCol, setSelectedDistCol] = useState<string>('');

  const fetchEDA = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get('/r/eda/summary');
      setData(resp.data);
      if (resp.data.distributions?.length > 0) {
        setSelectedDistCol(resp.data.distributions[0].column);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEDA();
  }, []);

  if (loading) return <LoadingState message="Computing descriptive statistics and correlations in R..." />;
  if (error) {
    if (error.includes('No dataset uploaded')) {
      return (
        <EmptyState
          title="No Dataset Uploaded"
          description="Upload clickstream data to compute statistics and correlations."
          onAction={onLoadDefault}
        />
      );
    }
    return <ErrorState message={error} onRetry={fetchEDA} />;
  }
  if (!data) return null;

  // 1. Distribution Chart Option
  const currentDist = data.distributions?.find((d) => d.column === selectedDistCol) || data.distributions?.[0];
  const distOption = currentDist
    ? {
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: currentDist.bins,
          axisLabel: { rotate: 30, interval: 0, fontSize: 10 },
        },
        yAxis: { type: 'value', name: 'Frequency' },
        series: [
          {
            name: currentDist.column,
            type: 'bar',
            data: currentDist.counts,
            itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          },
        ],
      }
    : {};

  // 2. Correlation Matrix Heatmap Option
  const corCols = data.correlations?.columns || [];
  const corItems = (data.correlations?.items || []).map((it) => [it.x_idx, it.y_idx, it.value]);
  const corHeatmapOption = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const x = corCols[params.data[0]];
        const y = corCols[params.data[1]];
        return `${x} & ${y}<br/>Correlation: <b>${params.data[2]}</b>`;
      },
    },
    grid: { height: '70%', top: '10%' },
    xAxis: {
      type: 'category',
      data: corCols,
      splitArea: { show: true },
      axisLabel: { rotate: 45, interval: 0, fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: corCols,
      splitArea: { show: true },
      axisLabel: { fontSize: 10 },
    },
    visualMap: {
      min: -1,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#ef4444', '#f8fafc', '#3b82f6'],
      },
    },
    series: [
      {
        name: 'Correlation',
        type: 'heatmap',
        data: corItems,
        label: { show: true, fontSize: 9 },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
        },
      },
    ],
  };

  // 3. Device Conversion Rate Option
  const devConvOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0 },
    xAxis: {
      type: 'category',
      data: data.device_conversion.map((d) => d.device),
    },
    yAxis: [
      { type: 'value', name: 'Sessions' },
      { type: 'value', name: 'Conv Rate (%)', position: 'right' },
    ],
    series: [
      {
        name: 'Sessions',
        type: 'bar',
        data: data.device_conversion.map((d) => d.sessions),
        itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Conv Rate (%)',
        type: 'line',
        yAxisIndex: 1,
        data: data.device_conversion.map((d) => d.rate),
        itemStyle: { color: '#10b981' },
      },
    ],
  };

  // 4. Traffic Conversion Rate Option
  const trafConvOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: data.traffic_conversion.map((t) => t.source),
      axisLabel: { rotate: 20 },
    },
    yAxis: { type: 'value', name: 'Conversion Rate (%)' },
    series: [
      {
        name: 'Conversion Rate (%)',
        type: 'bar',
        data: data.traffic_conversion.map((t) => t.rate),
        itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Exploratory Data Analysis (EDA)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Full parametric statistics, histograms, correlation matrices, and conversion cross-tabulations computed in R.
        </p>
      </div>

      {/* Numeric Stats Table */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
          Parametric & Non-Parametric Descriptive Statistics
        </h3>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Feature</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Count</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Mean</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">StdDev</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Min</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">25%</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Median</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">75%</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Max</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Missing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.numeric_stats.map((row) => (
                <tr key={row.column} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200">{row.column}</td>
                  <td className="px-3 py-1.5 text-right text-slate-500">{row.count.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right text-blue-600 dark:text-blue-400 font-semibold">{row.mean}</td>
                  <td className="px-3 py-1.5 text-right text-slate-500">{row.std_dev}</td>
                  <td className="px-3 py-1.5 text-right text-slate-500">{row.min}</td>
                  <td className="px-3 py-1.5 text-right text-slate-500">{row.q25}</td>
                  <td className="px-3 py-1.5 text-right text-slate-800 dark:text-slate-200 font-semibold">{row.median}</td>
                  <td className="px-3 py-1.5 text-right text-slate-500">{row.q75}</td>
                  <td className="px-3 py-1.5 text-right text-slate-500">{row.max}</td>
                  <td className="px-3 py-1.5 text-right text-slate-500">{row.missing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution Histograms & Correlations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Selector & Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Distribution Histogram (R hist)
            </h3>
            {data.distributions?.length > 0 && (
              <select
                value={selectedDistCol}
                onChange={(e) => setSelectedDistCol(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-hidden font-mono"
              >
                {data.distributions.map((d) => (
                  <option key={d.column} value={d.column}>
                    {d.column}
                  </option>
                ))}
              </select>
            )}
          </div>
          <DynamicChart option={distOption} height={350} isDark={isDark} />
        </div>

        {/* Correlation Heatmap */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center">
              <Grid className="w-4 h-4 mr-2 text-indigo-600" />
              Pearson Correlation Matrix (R cor)
            </h3>
            <span className="text-xs text-slate-400">Pairwise complete</span>
          </div>
          <DynamicChart option={corHeatmapOption} height={350} isDark={isDark} />
        </div>
      </div>

      {/* Device & Traffic Conversion Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Device Type: Sessions & Conversion Rate
          </h3>
          <DynamicChart option={devConvOption} height={280} isDark={isDark} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Traffic Source: Conversion Rate Comparison
          </h3>
          <DynamicChart option={trafConvOption} height={280} isDark={isDark} />
        </div>
      </div>
    </div>
  );
};
