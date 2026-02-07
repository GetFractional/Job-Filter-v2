import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Send,
  MessageSquare,
  Target,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { computeFunnelMetrics, computeBottleneckMetrics } from '../lib/metrics';
import { PIPELINE_STAGES } from '../types';
import type { FunnelMetrics, BottleneckMetrics } from '../types';

export function DashboardPage() {
  const jobs = useStore((s) => s.jobs);
  const activities = useStore((s) => s.activities);
  const [tab, setTab] = useState<'executive' | 'bottleneck'>('executive');

  const funnel = useMemo(() => computeFunnelMetrics(jobs, activities), [jobs, activities]);
  const bottleneck = useMemo(() => computeBottleneckMetrics(jobs), [jobs]);

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 bg-brand-50 rounded-lg flex items-center justify-center mb-4">
          <BarChart3 size={24} className="text-brand-600" />
        </div>
        <h2 className="text-h2 text-neutral-900 mb-1">No data yet</h2>
        <p className="text-sm text-neutral-500 mb-6 max-w-xs">
          Add jobs to your pipeline to see executive and bottleneck metrics.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-capture-modal'))}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm"
        >
          <Briefcase size={16} />
          Add a Job
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <h1 className="text-h1 text-neutral-900">Dashboard</h1>

      {/* Tab toggle */}
      <div className="flex bg-neutral-100 rounded-lg p-1">
        <button
          onClick={() => setTab('executive')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'executive'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <BarChart3 size={14} />
          Executive
        </button>
        <button
          onClick={() => setTab('bottleneck')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'bottleneck'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <AlertTriangle size={14} />
          Bottleneck
        </button>
      </div>

      {tab === 'executive' ? (
        <ExecutiveTab funnel={funnel} />
      ) : (
        <BottleneckTab bottleneck={bottleneck} />
      )}
    </div>
  );
}

function ExecutiveTab({ funnel }: { funnel: FunnelMetrics }) {
  const weekDelta = funnel.capturedThisWeek - funnel.capturedLastWeek;

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Captured This Week"
          value={funnel.capturedThisWeek}
          delta={weekDelta}
          icon={<Briefcase size={14} className="text-brand-500" />}
        />
        <MetricCard
          label="Pursue Rate"
          value={`${Math.round(funnel.pursueRate * 100)}%`}
          icon={<Target size={14} className="text-green-500" />}
        />
        <MetricCard
          label="Outreach Volume"
          value={funnel.outreachVolume}
          icon={<Send size={14} className="text-blue-500" />}
        />
        <MetricCard
          label="Response Rate"
          value={`${Math.round(funnel.responseRate * 100)}%`}
          icon={<MessageSquare size={14} className="text-violet-500" />}
        />
      </div>

      <MetricCard
        label="Pipeline Inventory"
        value={funnel.totalCaptured}
        icon={<Layers size={14} className="text-amber-500" />}
      />

      {/* Captured Trend */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Captured Trend</h3>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-900">{funnel.capturedThisWeek}</p>
            <p className="text-[11px] text-neutral-500 font-medium">This Week</p>
          </div>
          <div className="text-center text-neutral-300">
            <ArrowRight size={20} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-400">{funnel.capturedLastWeek}</p>
            <p className="text-[11px] text-neutral-500 font-medium">Last Week</p>
          </div>
          {weekDelta !== 0 && (
            <div className={`ml-auto flex items-center gap-1 text-sm font-semibold ${
              weekDelta > 0 ? 'text-green-600' : 'text-red-500'
            }`}>
              {weekDelta > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {weekDelta > 0 ? '+' : ''}{weekDelta}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Stage Bar Chart */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Pipeline by Stage</h3>
        <div className="space-y-2">
          {PIPELINE_STAGES.filter((s) => s !== 'Closed Lost').map((stage) => {
            const count = funnel.pipelineByStage[stage] || 0;
            const maxCount = Math.max(...Object.values(funnel.pipelineByStage), 1);
            const width = Math.max((count / maxCount) * 100, count > 0 ? 8 : 0);

            return (
              <div key={stage} className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-500 w-24 truncate text-right shrink-0">{stage}</span>
                <div className="flex-1 bg-neutral-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full flex items-center justify-end pr-1.5 transition-all duration-500"
                    style={{ width: `${width}%`, minWidth: count > 0 ? '24px' : '0' }}
                  >
                    {count > 0 && (
                      <span className="text-[9px] text-white font-bold">{count}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Conversion Rates</h3>
        <div className="space-y-2.5">
          {[
            { label: 'Screen Rate', value: funnel.screenRate },
            { label: 'Interview Rate', value: funnel.interviewRate },
            { label: 'Offer Rate', value: funnel.offerRate },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">{label}</span>
              <span className="text-sm font-bold text-neutral-900">{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BottleneckTab({ bottleneck }: { bottleneck: BottleneckMetrics }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Stage Conversion Funnel */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Stage Conversion Funnel</h3>
        <div className="space-y-2">
          {Object.entries(bottleneck.conversionByStage).map(([transition, rate]) => {
            const pct = Math.round(rate * 100);
            const barColor = rate > 0.5 ? 'bg-green-500' : rate > 0.2 ? 'bg-amber-500' : 'bg-red-400';
            return (
              <div key={transition} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-600 truncate max-w-[70%]">{transition}</span>
                  <span className={`text-[11px] font-bold ${
                    rate > 0.5 ? 'text-green-700' : rate > 0.2 ? 'text-amber-700' : 'text-red-600'
                  }`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${Math.max(pct, rate > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time in Stage Table */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Median Time in Stage</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase pb-2">Stage</th>
                <th className="text-right text-[11px] font-semibold text-neutral-500 uppercase pb-2">Median</th>
                <th className="text-right text-[11px] font-semibold text-neutral-500 uppercase pb-2 w-12">Status</th>
              </tr>
            </thead>
            <tbody>
              {PIPELINE_STAGES.filter((s) => bottleneck.medianTimeInStage[s] > 0).map((stage) => {
                const hours = bottleneck.medianTimeInStage[stage];
                const display = hours > 48 ? `${Math.round(hours / 24)}d` : `${Math.round(hours)}h`;
                const isLong = hours > 120;
                const isMedium = hours > 48 && !isLong;

                return (
                  <tr key={stage} className="border-b border-neutral-50">
                    <td className="py-2 text-xs text-neutral-700">{stage}</td>
                    <td className="py-2 text-right text-xs font-semibold text-neutral-900">{display}</td>
                    <td className="py-2 text-right">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isLong ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stalled Jobs */}
      {bottleneck.stalledJobs.length > 0 && (
        <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={12} className="text-amber-600" />
            </div>
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Stalled Jobs ({bottleneck.stalledJobs.length})
            </h3>
          </div>
          <p className="text-[11px] text-neutral-500 mb-3">No activity in 5+ days</p>
          <div className="space-y-2">
            {bottleneck.stalledJobs.map((job) => {
              const daysSince = Math.floor((Date.now() - new Date(job.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/job/${job.id}`)}
                  className="w-full text-left bg-amber-50/50 rounded-lg border border-amber-100 p-3 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{job.title}</p>
                      <p className="text-xs text-neutral-500">{job.company}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                        {job.stage}
                      </span>
                      <p className="text-[11px] text-red-500 font-medium mt-0.5 flex items-center gap-0.5 justify-end">
                        <Clock size={9} />
                        {daysSince}d stalled
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: number | string;
  delta?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        {delta !== undefined && delta !== 0 && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 mb-0.5 ${
            delta > 0 ? 'text-green-600' : 'text-red-500'
          }`}>
            {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </div>
  );
}
