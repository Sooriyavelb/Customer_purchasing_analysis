import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { FunnelResponse, FunnelStage } from '../types';
import { DynamicChart } from '../components/DynamicChart';
import { MetricCard } from '../components/MetricCard';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import { Filter, ArrowDown, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ConversionFunnel: React.FC<{ isDark: boolean; onLoadDefault: () => void }> = ({
  isDark,
  onLoadDefault,
}) => {
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customStages, setCustomStages] = useState<any[] | null>(null);

  const fetchFunnel = async (stagesPayload?: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.post('/r/funnel/analysis', {
        stages: stagesPayload || customStages,
      });
      setData(resp.data);
      if (!customStages) {
        setCustomStages(resp.data.stages);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnel();
  }, []);

  if (loading && !data) return <LoadingState message="Calculating funnel stage conversions in R..." />;
  if (error) {
    if (error.includes('No dataset uploaded')) {
      return (
        <EmptyState
          title="No Clickstream Data Loaded"
          description="Upload your clickstream data to compute multi-stage funnel drop-offs."
          onAction={onLoadDefault}
        />
      );
    }
    return <ErrorState message={error} onRetry={() => fetchFunnel()} />;
  }
  if (!data) return null;

  // Funnel ECharts Option
  const funnelChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} sessions ({d}%)',
    },
    series: [
      {
        name: 'Funnel Stage',
        type: 'funnel',
        left: '10%',
        top: 30,
        bottom: 30,
        width: '80%',
        min: 0,
        max: data.total_entry_sessions,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 3,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}: {c} sessions',
          color: '#fff',
          fontWeight: 'bold',
        },
        data: data.stages.map((st) => ({
          name: st.name,
          value: st.sessions,
        })),
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Multi-Stage Conversion Funnel Analysis
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track user drop-off across custom journey checkpoints: Browse &rarr; Add to Cart &rarr; Checkout &rarr; Purchase.
          </p>
        </div>
        <button
          onClick={() => fetchFunnel()}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate Funnel</span>
        </button>
      </div>

      {/* Funnel KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Entry Cohort"
          value={data.total_entry_sessions.toLocaleString()}
          subtitle="Top of funnel sessions"
          icon={Filter}
          badge="Stage 1"
          badgeColor="blue"
        />
        <MetricCard
          title="Overall Funnel Conversion"
          value={`${data.overall_funnel_rate}%`}
          subtitle="Entry to final purchase conversion"
          icon={CheckCircle2}
          badge="End-to-End"
          badgeColor="green"
        />
        <MetricCard
          title="Final Stage Buyers"
          value={data.stages[data.stages.length - 1]?.sessions.toLocaleString() || 0}
          subtitle="Completed checkout / purchase"
          icon={CheckCircle2}
          badge="Completed"
          badgeColor="purple"
        />
      </div>

      {/* Visual Funnel Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Funnel Visualizer (Apache ECharts Funnel)
        </h3>
        <DynamicChart option={funnelChartOption} height={340} isDark={isDark} />
      </div>

      {/* Detailed Stage-by-Stage Table */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Stage Progression, Drop-Off & Step Conversion
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Step</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Stage Name</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Events Included</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Sessions</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Drop-Off</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Drop-Off Rate</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Step Conv %</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Overall %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.stages.map((st) => (
                <tr key={st.step} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2 text-slate-400 font-bold">#{st.step}</td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-200 font-semibold">{st.name}</td>
                  <td className="px-3 py-2 text-slate-500">{st.events.join(', ')}</td>
                  <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-200 font-bold">{st.sessions.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-rose-500">{st.drop_off_count.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-rose-600 dark:text-rose-400 font-semibold">{st.drop_off_rate}%</td>
                  <td className="px-3 py-2 text-right text-blue-600 dark:text-blue-400 font-semibold">{st.step_conversion}%</td>
                  <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400 font-bold">{st.overall_conversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
