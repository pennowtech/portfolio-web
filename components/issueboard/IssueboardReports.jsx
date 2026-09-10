import { FiAlertCircle, FiArrowDownRight, FiCalendar, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi';

const surface = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

const StatCard = ({ label, value, note, icon: Icon, tone }) => (
  <article className={`${surface} p-4`}>
    <div className='flex items-start justify-between gap-3'>
      <div>
        <p className='text-xs font-semibold text-slate-500'>{label}</p>
        <strong className='mt-2 block text-2xl tracking-tight'>{value}</strong>
        <p className='mt-1 text-xs text-slate-500'>{note}</p>
      </div>
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon aria-hidden='true' />
      </span>
    </div>
  </article>
);

const ChartCard = ({ title, subtitle, children, analysis }) => (
  <article className={`${surface} min-w-0 p-5`}>
    <h3 className='font-bold'>{title}</h3>
    <p className='mt-1 text-xs text-slate-500'>{subtitle}</p>
    <div className='mt-5'>{children}</div>
    {analysis && (
      <div className='mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs leading-5 text-slate-600 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-slate-300'>
        <strong className='mr-1 text-emerald-800 dark:text-emerald-200'>Analysis:</strong>
        {analysis}
      </div>
    )}
  </article>
);

const statusData = [
  ['Done', 10, 'bg-emerald-500'],
  ['In progress', 6, 'bg-blue-500'],
  ['Review', 4, 'bg-amber-500'],
  ['To do', 4, 'bg-slate-300 dark:bg-slate-600']
];

const StatusChart = () => (
  <div className='grid items-center gap-6 sm:grid-cols-[10rem_1fr]'>
    <div
      className='relative mx-auto size-36 rounded-full'
      style={{
        background:
          'conic-gradient(#10b981 0 41.67%, #3b82f6 41.67% 66.67%, #f59e0b 66.67% 83.33%, #cbd5e1 83.33% 100%)'
      }}
      aria-label='10 done, 6 in progress, 4 in review, and 4 to do'
    >
      <div className='absolute inset-7 grid place-items-center rounded-full bg-white text-center dark:bg-slate-900'>
        <span>
          <strong className='block text-xl'>24</strong>
          <small className='text-[10px] text-slate-500'>issues</small>
        </span>
      </div>
    </div>
    <div className='space-y-2'>
      {statusData.map(([label, value, color]) => (
        <div key={label} className='grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs'>
          <span className={`size-2.5 rounded-full ${color}`} />
          <span className='text-slate-500'>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  </div>
);

const weeklyFlow = [
  { week: 'W32', created: 8, completed: 6 },
  { week: 'W33', created: 13, completed: 11 },
  { week: 'W34', created: 10, completed: 15 },
  { week: 'W35', created: 16, completed: 12 },
  { week: 'W36', created: 9, completed: 13 },
  { week: 'W37', created: 12, completed: 14 }
];

const DataDetails = ({ summary, rows, firstLabel, secondLabel }) => (
  <details className='mt-3 text-xs text-slate-500'>
    <summary className='cursor-pointer font-semibold'>{summary}</summary>
    <div className='mt-2 grid grid-cols-3 gap-1'>
      {rows.map(({ label, first, second }) => (
        <div key={label} className='contents'>
          <span>{label}</span>
          <span>
            {first} {firstLabel}
          </span>
          <span>
            {second} {secondLabel}
          </span>
        </div>
      ))}
    </div>
  </details>
);

const FlowChart = () => (
  <>
    <div className='flex h-44 items-end gap-3 border-b border-slate-200 px-1 dark:border-slate-700' aria-hidden='true'>
      {weeklyFlow.map((item) => (
        <div key={item.week} className='flex min-w-0 flex-1 items-end justify-center gap-1'>
          <div className='w-3 rounded-t bg-blue-400 sm:w-5' style={{ height: `${item.created * 8}px` }} />
          <div className='w-3 rounded-t bg-emerald-500 sm:w-5' style={{ height: `${item.completed * 8}px` }} />
        </div>
      ))}
    </div>
    <div className='mt-2 grid grid-cols-6 text-center text-[10px] text-slate-500'>
      {weeklyFlow.map(({ week }) => (
        <span key={week}>{week}</span>
      ))}
    </div>
    <div className='mt-3 flex justify-center gap-5 text-xs'>
      <Legend color='bg-blue-400' label='Created' />
      <Legend color='bg-emerald-500' label='Completed' />
    </div>
    <DataDetails
      summary='View weekly values'
      rows={weeklyFlow.map(({ week, created, completed }) => ({ label: week, first: created, second: completed }))}
      firstLabel='created'
      secondLabel='completed'
    />
  </>
);

const Legend = ({ color, label }) => (
  <span className='flex items-center gap-1.5'>
    <i className={`size-2.5 rounded-sm ${color}`} />
    {label}
  </span>
);

const velocity = [
  { sprint: 'S-39', planned: 24, done: 20 },
  { sprint: 'S-40', planned: 27, done: 23 },
  { sprint: 'S-41', planned: 26, done: 25 },
  { sprint: 'S-42', planned: 31, done: 22 },
  { sprint: 'S-43', planned: 28, done: 24 },
  { sprint: 'S-44', planned: 29, done: 18 }
];

const VelocityChart = () => (
  <>
    <div className='overflow-x-auto'>
      <div className='min-w-[32rem]'>
        <div className='relative h-52 border-b border-l border-slate-200 dark:border-slate-700'>
          {[10, 20, 30].map((value) => (
            <div
              key={value}
              className='absolute inset-x-0 border-t border-dashed border-slate-200 dark:border-slate-800'
              style={{ bottom: `${value * 5.5}px` }}
            >
              <span className='absolute -left-7 -top-2 text-[9px] text-slate-400'>{value}</span>
            </div>
          ))}
          <div className='absolute inset-0 flex items-end justify-around px-5' aria-hidden='true'>
            {velocity.map((item) => (
              <div key={item.sprint} className='flex h-full items-end gap-1'>
                <div
                  className='w-5 rounded-t bg-blue-300 dark:bg-blue-800'
                  style={{ height: `${item.planned * 5.5}px` }}
                />
                <div className='w-5 rounded-t bg-emerald-500' style={{ height: `${item.done * 5.5}px` }} />
              </div>
            ))}
          </div>
        </div>
        <div className='grid grid-cols-6 px-5 pt-2 text-center text-[10px] text-slate-500'>
          {velocity.map(({ sprint }) => (
            <span key={sprint}>{sprint}</span>
          ))}
        </div>
      </div>
    </div>
    <div className='mt-3 flex justify-center gap-5 text-xs'>
      <Legend color='bg-blue-300 dark:bg-blue-800' label='Committed' />
      <Legend color='bg-emerald-500' label='Completed' />
    </div>
    <DataDetails
      summary='View sprint values'
      rows={velocity.map(({ sprint, planned, done }) => ({ label: sprint, first: planned, second: done }))}
      firstLabel='committed'
      secondLabel='completed'
    />
  </>
);

const burnPoints = [29, 27, 27, 23, 20, 18, 18, 14, 11, 11, 8];

const BurndownChart = () => {
  const actual = burnPoints.map((value, index) => `${32 + index * 48},${190 - value * 5}`).join(' ');
  return (
    <>
      <div className='overflow-x-auto'>
        <svg viewBox='0 0 550 220' className='min-w-[32rem]' role='img' aria-labelledby='burndown-title burndown-desc'>
          <title id='burndown-title'>Sprint 04 burndown</title>
          <desc id='burndown-desc'>
            Remaining work decreased from 29 to 8 points over eleven days, above the ideal zero-point trajectory.
          </desc>
          {[45, 95, 145, 195].map((y) => (
            <line
              key={y}
              x1='32'
              x2='520'
              y1={y}
              y2={y}
              className='stroke-slate-200 dark:stroke-slate-800'
              strokeDasharray='4 5'
            />
          ))}
          <line
            x1='32'
            x2='512'
            y1='45'
            y2='190'
            className='stroke-slate-300 dark:stroke-slate-600'
            strokeWidth='2'
            strokeDasharray='7 6'
          />
          <polyline
            points={actual}
            fill='none'
            className='stroke-emerald-500'
            strokeWidth='3'
            strokeLinejoin='round'
            strokeLinecap='round'
          />
          {burnPoints.map((value, index) => (
            <circle
              key={index}
              cx={32 + index * 48}
              cy={190 - value * 5}
              r='3.5'
              className='fill-white stroke-emerald-500 dark:fill-slate-900'
              strokeWidth='2'
            />
          ))}
          {['D1', 'D3', 'D5', 'D7', 'D9', 'D11'].map((day, index) => (
            <text key={day} x={32 + index * 96} y='212' textAnchor='middle' className='fill-slate-400 text-[9px]'>
              {day}
            </text>
          ))}
        </svg>
      </div>
      <div className='mt-2 flex justify-center gap-5 text-xs'>
        <span className='flex items-center gap-1.5'>
          <i className='h-0 w-4 border-t-2 border-emerald-500' />
          Remaining
        </span>
        <span className='flex items-center gap-1.5'>
          <i className='h-0 w-4 border-t-2 border-dashed border-slate-400' />
          Ideal
        </span>
      </div>
      <details className='mt-3 text-xs text-slate-500'>
        <summary className='cursor-pointer font-semibold'>View daily remaining points</summary>
        <p className='mt-2'>{burnPoints.map((points, index) => `Day ${index + 1}: ${points}`).join(' · ')}</p>
      </details>
    </>
  );
};

const BreakdownRow = ({ label, value, total, color }) => (
  <div className='grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-xs'>
    <span className='truncate text-slate-500'>{label}</span>
    <div className='h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800'>
      <span className={`block h-full rounded-full ${color}`} style={{ width: `${(value / total) * 100}%` }} />
    </div>
    <strong className='text-right'>{value}</strong>
  </div>
);

const WorkBreakdown = () => (
  <div className='grid gap-6 sm:grid-cols-2'>
    <div>
      <h4 className='mb-3 text-xs font-bold uppercase tracking-wide text-slate-500'>By priority</h4>
      <div className='space-y-3'>
        <BreakdownRow label='Highest' value={3} total={12} color='bg-rose-500' />
        <BreakdownRow label='High' value={7} total={12} color='bg-orange-500' />
        <BreakdownRow label='Medium' value={12} total={12} color='bg-amber-500' />
        <BreakdownRow label='Low' value={2} total={12} color='bg-sky-500' />
      </div>
    </div>
    <div>
      <h4 className='mb-3 text-xs font-bold uppercase tracking-wide text-slate-500'>By type</h4>
      <div className='space-y-3'>
        <BreakdownRow label='Task' value={11} total={11} color='bg-blue-500' />
        <BreakdownRow label='Story' value={6} total={11} color='bg-emerald-500' />
        <BreakdownRow label='Bug' value={5} total={11} color='bg-rose-500' />
        <BreakdownRow label='Epic' value={2} total={11} color='bg-violet-500' />
      </div>
    </div>
  </div>
);

const RiskSummary = () => (
  <div className='grid gap-3 sm:grid-cols-3'>
    {[
      ['Overdue', '3 issues', '2 are highest priority', 'text-rose-600', FiAlertCircle],
      ['Ageing work', '5 issues', 'Open longer than 14 days', 'text-amber-600', FiClock],
      ['Carried over', '11 points', 'From Sprint 03', 'text-violet-600', FiArrowDownRight]
    ].map(([label, value, note, color, Icon]) => (
      <div key={label} className='rounded-xl border border-slate-200 p-3 dark:border-slate-800'>
        <div className='flex items-center gap-2'>
          <Icon className={color} />
          <strong className='text-sm'>{label}</strong>
        </div>
        <strong className='mt-3 block text-xl'>{value}</strong>
        <span className='text-xs text-slate-500'>{note}</span>
      </div>
    ))}
  </div>
);

const ReportsView = () => (
  <section>
    <div className='mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div>
        <h2 className='text-xl font-bold tracking-tight'>Reports</h2>
        <p className='mt-1 text-sm text-slate-500'>
          Understand flow and sprint outcomes without turning sparse data into vanity metrics.
        </p>
      </div>
      <label className='text-xs font-semibold text-slate-500'>
        Reporting period
        <select className='ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white'>
          <option>Sprint 04</option>
          <option>Last 6 sprints</option>
          <option>Last 90 days</option>
        </select>
      </label>
    </div>
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      <StatCard
        label='Committed'
        value='29'
        note='Story points'
        icon={FiCalendar}
        tone='bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      />
      <StatCard
        label='Completed'
        value='18'
        note='62% of commitment'
        icon={FiCheckCircle}
        tone='bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      />
      <StatCard
        label='Cycle time'
        value='2.4d'
        note='Median for completed work'
        icon={FiClock}
        tone='bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
      />
      <StatCard
        label='Carry-over risk'
        value='8'
        note='Points still not started'
        icon={FiAlertCircle}
        tone='bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
      />
    </div>
    <div className='mt-4 grid gap-4 xl:grid-cols-2'>
      <ChartCard title='Work by status' subtitle='Current issue distribution in Sprint 04'>
        <StatusChart />
      </ChartCard>
      <ChartCard title='Created vs completed' subtitle='Last six weeks'>
        <FlowChart />
      </ChartCard>
      <ChartCard
        title='Velocity'
        subtitle='Committed and completed story points across six sprints'
        analysis='Completed velocity averaged 22 points before Sprint 04. The current 18-point result is below that baseline while commitment stayed high, suggesting future planning should use recent completed capacity rather than the 29-point commitment.'
      >
        <VelocityChart />
      </ChartCard>
      <ChartCard
        title='Sprint burndown'
        subtitle='Remaining story points against the ideal Sprint 04 trajectory'
        analysis='Work is burning down, but the team remains 8 points above the ideal finish line. Two flat periods indicate blocked or oversized work; focus on completing in-progress items before pulling more work into the sprint.'
      >
        <BurndownChart />
      </ChartCard>
      <ChartCard title='Work composition' subtitle='Open issues by priority and issue type'>
        <WorkBreakdown />
      </ChartCard>
      <ChartCard title='Ageing and delivery risk' subtitle='Work requiring attention before sprint completion'>
        <RiskSummary />
      </ChartCard>
    </div>
    <div className={`${surface} mt-4 grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center`}>
      <div className='flex gap-3'>
        <FiTrendingUp className='mt-0.5 shrink-0 text-emerald-600' />
        <div>
          <h3 className='text-sm font-bold'>Sprint completion summary</h3>
          <p className='mt-1 text-xs leading-5 text-slate-500'>
            18 of 29 points completed · 11 points projected to carry over · 3 overdue issues · median cycle time 2.4
            days.
          </p>
        </div>
      </div>
      <span className='w-fit rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200'>
        Delivery confidence · At risk
      </span>
    </div>
  </section>
);

export default ReportsView;
