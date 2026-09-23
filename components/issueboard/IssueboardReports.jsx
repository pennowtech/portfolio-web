import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiUsers } from 'react-icons/fi';

const surface = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

const jsonFetch = async (url) => {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, payload };
};

const StatCard = ({ label, value, note, icon: Icon, tone }) => (
  <article className={`${surface} p-4`}>
    <div className='flex items-start justify-between gap-3'>
      <div>
        <p className='text-xs font-semibold text-slate-500'>{label}</p>
        <strong className='mt-2 block text-2xl tracking-tight'>{value}</strong>
        {note && <p className='mt-1 text-xs text-slate-500'>{note}</p>}
      </div>
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon aria-hidden='true' />
      </span>
    </div>
  </article>
);

const ChartCard = ({ title, subtitle, children }) => (
  <article className={`${surface} min-w-0 p-5`}>
    <h3 className='font-bold'>{title}</h3>
    {subtitle && <p className='mt-1 text-xs text-slate-500'>{subtitle}</p>}
    <div className='mt-5'>{children}</div>
  </article>
);

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#94a3b8'];

const StatusChart = ({ byStatus, total }) => {
  const entries = Object.entries(byStatus);
  if (total === 0) return <p className='text-sm text-slate-500'>No issues yet.</p>;

  let cumulative = 0;
  const stops = entries.map(([, count], index) => {
    const start = (cumulative / total) * 100;
    cumulative += count;
    const end = (cumulative / total) * 100;
    return `${DONUT_COLORS[index % DONUT_COLORS.length]} ${start}% ${end}%`;
  });

  return (
    <div className='grid items-center gap-6 sm:grid-cols-[10rem_1fr]'>
      <div
        className='relative mx-auto size-36 rounded-full'
        style={{ background: `conic-gradient(${stops.join(', ')})` }}
        aria-label={entries.map(([name, count]) => `${count} ${name}`).join(', ')}
      >
        <div className='absolute inset-7 grid place-items-center rounded-full bg-white text-center dark:bg-slate-900'>
          <span>
            <strong className='block text-xl'>{total}</strong>
            <small className='text-[10px] text-slate-500'>issues</small>
          </span>
        </div>
      </div>
      <div className='space-y-2'>
        {entries.map(([label, value], index) => (
          <div key={label} className='grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs'>
            <span
              className='size-2.5 rounded-full'
              style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
            />
            <span className='text-slate-500'>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

const Legend = ({ color, label }) => (
  <span className='flex items-center gap-1.5 text-slate-700 dark:text-slate-300'>
    <i className={`size-2.5 rounded-sm ${color}`} />
    {label}
  </span>
);

const FlowChart = ({ weeklyFlow }) => {
  const maxValue = Math.max(1, ...weeklyFlow.map((week) => Math.max(week.created, week.completed)));
  const scale = 140 / maxValue;
  return (
    <>
      <div
        className='flex h-44 items-end gap-3 border-b border-slate-200 px-1 dark:border-slate-700'
        aria-hidden='true'
      >
        {weeklyFlow.map((week) => (
          <div key={week.weekStart} className='flex min-w-0 flex-1 items-end justify-center gap-1'>
            <div className='w-3 rounded-t bg-blue-400 sm:w-5' style={{ height: `${week.created * scale}px` }} />
            <div className='w-3 rounded-t bg-emerald-500 sm:w-5' style={{ height: `${week.completed * scale}px` }} />
          </div>
        ))}
      </div>
      <div className='mt-2 grid grid-cols-6 text-center text-[10px] text-slate-500'>
        {weeklyFlow.map((week) => (
          <span key={week.weekStart}>
            {new Date(week.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
      <div className='mt-3 flex justify-center gap-5 text-xs'>
        <Legend color='bg-blue-400' label='Created' />
        <Legend color='bg-emerald-500' label='Completed' />
      </div>
    </>
  );
};

const BreakdownRow = ({ label, value, total, color }) => (
  <div className='grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-xs'>
    <span className='truncate capitalize text-slate-500'>{label}</span>
    <div className='h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800'>
      <span
        className={`block h-full rounded-full ${color}`}
        style={{ width: `${total ? (value / total) * 100 : 0}%` }}
      />
    </div>
    <strong className='text-right'>{value}</strong>
  </div>
);

const PRIORITY_COLORS = {
  highest: 'bg-rose-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-sky-500',
  lowest: 'bg-slate-400'
};
const TYPE_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-violet-500', 'bg-cyan-500', 'bg-orange-500'];

const WorkBreakdown = ({ byPriority, byType }) => {
  const priorityTotal = Object.values(byPriority).reduce((sum, value) => sum + value, 0);
  const typeTotal = Object.values(byType).reduce((sum, value) => sum + value, 0);
  return (
    <div className='grid gap-6 sm:grid-cols-2'>
      <div>
        <h4 className='mb-3 text-xs font-bold uppercase tracking-wide text-slate-500'>By priority</h4>
        <div className='space-y-3'>
          {Object.entries(byPriority).map(([priority, count]) => (
            <BreakdownRow
              key={priority}
              label={priority}
              value={count}
              total={priorityTotal}
              color={PRIORITY_COLORS[priority] || 'bg-slate-400'}
            />
          ))}
          {priorityTotal === 0 && <p className='text-xs text-slate-500'>No issues yet.</p>}
        </div>
      </div>
      <div>
        <h4 className='mb-3 text-xs font-bold uppercase tracking-wide text-slate-500'>By type</h4>
        <div className='space-y-3'>
          {Object.entries(byType).map(([type, count], index) => (
            <BreakdownRow
              key={type}
              label={type}
              value={count}
              total={typeTotal}
              color={TYPE_COLORS[index % TYPE_COLORS.length]}
            />
          ))}
          {typeTotal === 0 && <p className='text-xs text-slate-500'>No issues yet.</p>}
        </div>
      </div>
    </div>
  );
};

const RiskSummary = ({ overdue, ageing }) => (
  <div className='grid gap-3 sm:grid-cols-2'>
    <div className='rounded-xl border border-slate-200 p-3 dark:border-slate-800'>
      <div className='flex items-center gap-2'>
        <FiAlertCircle className='text-rose-600' />
        <strong className='text-sm'>Overdue</strong>
      </div>
      <strong className='mt-3 block text-xl'>{overdue.length}</strong>
      <span className='text-xs text-slate-500'>
        {overdue.length === 0 ? 'Nothing overdue' : overdue.map((i) => i.key).join(', ')}
      </span>
    </div>
    <div className='rounded-xl border border-slate-200 p-3 dark:border-slate-800'>
      <div className='flex items-center gap-2'>
        <FiClock className='text-amber-600' />
        <strong className='text-sm'>Ageing work</strong>
      </div>
      <strong className='mt-3 block text-xl'>{ageing.length}</strong>
      <span className='text-xs text-slate-500'>
        {ageing.length === 0
          ? 'Open longer than 14 days: none'
          : `Open longer than 14 days: ${ageing.map((i) => i.key).join(', ')}`}
      </span>
    </div>
  </div>
);

const SprintCard = ({ sprint, kind }) => (
  <article className={`${surface} p-5`}>
    <h3 className='font-bold'>{kind === 'active' ? 'Active sprint' : 'Last completed sprint'}</h3>
    <p className='mt-1 text-xs text-slate-500'>{sprint.name}</p>
    <div className='mt-4 flex justify-between text-xs'>
      <strong>
        {sprint.completedPoints} / {kind === 'active' ? sprint.committedPoints : sprint.completedPoints} points
      </strong>
      {kind === 'active' && (
        <span>{sprint.committedPoints ? Math.round((sprint.completedPoints / sprint.committedPoints) * 100) : 0}%</span>
      )}
    </div>
    {kind === 'active' && (
      <div className='mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
        <div
          className='h-full rounded-full bg-emerald-600'
          style={{ width: `${sprint.committedPoints ? (sprint.completedPoints / sprint.committedPoints) * 100 : 0}%` }}
        />
      </div>
    )}
    <p className='mt-3 text-xs text-slate-500'>
      {kind === 'active'
        ? `${sprint.completedIssues} of ${sprint.totalIssues} issues done`
        : `${sprint.completedIssues} issues completed${sprint.carriedOverIssues != null ? ` · ${sprint.carriedOverIssues} carried over` : ''}`}
    </p>
  </article>
);

const ReportsView = ({ project }) => {
  const [status, setStatus] = useState('loading');
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!project) return;
    setStatus('loading');
    jsonFetch(`/api/issueboard/projects/${encodeURIComponent(project.key)}/reports`).then(({ ok, payload }) => {
      if (!ok || !payload?.ok) {
        setStatus('unavailable');
        setError(payload?.error?.message || 'Issue management is temporarily unavailable.');
        return;
      }
      setReport(payload.report);
      setStatus('ready');
    });
  }, [project]);

  if (!project) return null;
  if (status === 'loading') return null;
  if (status === 'unavailable')
    return (
      <div className='rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'>
        <strong className='block'>Issue management is temporarily unavailable</strong>
        <p className='mt-1 text-xs leading-5'>{error}</p>
      </div>
    );

  return (
    <section>
      <div className='mb-5'>
        <h2 className='text-xl font-bold tracking-tight'>Reports</h2>
        <p className='mt-1 text-sm text-slate-500'>Current state and recent flow for {project.name}.</p>
      </div>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          label='Open issues'
          value={report.openIssues}
          note={`${report.totalIssues} total`}
          icon={FiCheckCircle}
          tone='bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
        />
        <StatCard
          label='Done'
          value={report.doneIssues}
          icon={FiCheckCircle}
          tone='bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
        />
        <StatCard
          label='Unassigned'
          value={report.unassignedIssues}
          icon={FiUsers}
          tone='bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
        />
        <StatCard
          label='Overdue'
          value={report.overdue.length}
          icon={FiAlertCircle}
          tone='bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
        />
      </div>
      {(report.activeSprint || report.lastCompletedSprint) && (
        <div className='mt-4 grid gap-4 sm:grid-cols-2'>
          {report.activeSprint && <SprintCard sprint={report.activeSprint} kind='active' />}
          {report.lastCompletedSprint && <SprintCard sprint={report.lastCompletedSprint} kind='completed' />}
        </div>
      )}
      <div className='mt-4 grid gap-4 xl:grid-cols-2'>
        <ChartCard title='Work by status' subtitle='Current issue distribution'>
          <StatusChart byStatus={report.byStatus} total={report.totalIssues} />
        </ChartCard>
        <ChartCard title='Created vs completed' subtitle='Last six weeks'>
          <FlowChart weeklyFlow={report.weeklyFlow} />
        </ChartCard>
        <ChartCard title='Work composition' subtitle='Open and completed issues by priority and type'>
          <WorkBreakdown byPriority={report.byPriority} byType={report.byType} />
        </ChartCard>
        <ChartCard title='Ageing and delivery risk' subtitle='Work requiring attention'>
          <RiskSummary overdue={report.overdue} ageing={report.ageing} />
        </ChartCard>
      </div>
    </section>
  );
};

export default ReportsView;
