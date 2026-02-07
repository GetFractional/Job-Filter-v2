import { useState } from 'react';
import { useStore } from '../store/useStore';
import { computeFunnelMetrics, computeBottleneckMetrics } from '../lib/metrics';
import { PIPELINE_STAGES } from '../types';
import { BarChart3, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const jobs = useStore((s) => s.jobs);
  const activities = useStore((s) => s.activities);
  const [tab, setTab] = useState<'executive' | 'bottleneck'>('executive');

  const funnel = computeFunnelMetrics(jobs, activities);
  const bottleneck = computeBottleneckMetrics(jobs);

  if (jobs.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BarChart3 size={28} className="text-neutral-300 mb-3" />
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">No data yet</h2>
        <p className="text-sm text-neutral-500">Add jobs to see your dashboard metrics.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Tab toggle */}
      <div className="flex bg-neutral-100 rounded-lg p-0.5">
        <button
          onClick={() => setTab('executive')}
          className={`flex-1 py-2 text-sm font-medium rounded-md ${
            tab === 'executive' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
          }`}
        >
          Executive
        </button>
        <button
          onClick={() => setTab('bottleneck')}
          className={`flex-1 py-2 text-sm font-medium rounded-md ${
            tab === 'bottleneck' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
          }`}
        >
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

function ExecutiveTab({ funnel }: { funnel: ReturnType<typeof computeFunnelMetrics> }) {
  const weekDelta = funnel.capturedThisWeek - funnel.capturedLastWeek;

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Captured (week)"
          value={funnel.capturedThisWeek}
          delta={weekDelta}
        />
        <MetricCard
          label="Pursue Rate"
          value={`${Math.round(funnel.pursueRate * 100)}%`}
        />
        <MetricCard
          label="Outreach Volume"
          value={funnel.outreachVolume}
        />
        <MetricCard
          label="Response Rate"
          value={`${Math.round(funnel.responseRate * 100)}%`}
        />
      </div>

      {/* Pipeline bar chart */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Pipeline by Stage</h3>
        <div className="space-y-2">
          {PIPELINE_STAGES.filter((s) => s !== 'Closed Lost').map((stage) => {
            const count = funnel.pipelineByStage[stage] || 0;
            const maxCount = Math.max(...Object.values(funnel.pipelineByStage), 1);
            const width = Math.max((count / maxCount) * 100, count > 0 ? 8 : 0);

            return (
              <div key={stage} className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 w-24 truncate text-right">{stage}</span>
                <div className="flex-1 bg-neutral-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full flex items-center justify-end pr-1"
                    style={{ width: `${width}%`, minWidth: count > 0 ? '20px' : '0' }}
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

      {/* Funnel rates */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Conversion Rates</h3>
        <div className="space-y-2">
          {[
            { label: 'Screen Rate', value: funnel.screenRate },
            { label: 'Interview Rate', value: funnel.interviewRate },
            { label: 'Offer Rate', value: funnel.offerRate },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">{label}</span>
              <span className="text-sm font-semibold text-neutral-900">{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BottleneckTab({ bottleneck }: { bottleneck: ReturnType<typeof computeBottleneckMetrics> }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Stage conversion */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Stage Conversion</h3>
        <div className="space-y-2">
          {Object.entries(bottleneck.conversionByStage).map(([transition, rate]) => (
            <div key={transition} className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500 w-36 truncate">{transition}</span>
              <div className="flex-1 bg-neutral-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${rate > 0.5 ? 'bg-green-500' : rate > 0.2 ? 'bg-amber-500' : 'bg-red-400'}`}
                  style={{ width: `${Math.max(rate * 100, rate > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-neutral-700 w-10 text-right">
                {Math.round(rate * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time in stage */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Median Time in Stage</h3>
        <div className="space-y-1">
          {PIPELINE_STAGES.filter((s) => bottleneck.medianTimeInStage[s] > 0).map((stage) => {
            const hours = bottleneck.medianTimeInStage[stage];
            const display = hours > 48 ? `${Math.round(hours / 24)}d` : `${Math.round(hours)}h`;
            const isLong = hours > 120; // > 5 days

            return (
              <div key={stage} className="flex items-center justify-between py-1">
                <span className="text-xs text-neutral-700">{stage}</span>
                <span className={`text-xs font-medium ${isLong ? 'text-red-600' : 'text-neutral-900'}`}>
                  {display}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stalled jobs */}
      {bottleneck.stalledJobs.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-600" />
            <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Stalled ({bottleneck.stalledJobs.length})
            </h3>
          </div>
          <div className="space-y-2">
            {bottleneck.stalledJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => navigate(`/job/${job.id}`)}
                className="w-full text-left bg-white rounded-lg border border-amber-200 p-2"
              >
                <p className="text-sm font-medium text-neutral-900">{job.title}</p>
                <p className="text-xs text-neutral-500">{job.company} | {job.stage}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, delta }: { label: string; value: number | string; delta?: number }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-3">
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-end gap-1">
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        {delta !== undefined && delta !== 0 && (
          <span className={`text-[10px] font-medium flex items-center gap-0.5 mb-1 ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </div>
  );
}
