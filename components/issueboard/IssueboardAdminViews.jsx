import { useState } from 'react';
import {
  FiAlertTriangle,
  FiCheck,
  FiCloud,
  FiCode,
  FiDatabase,
  FiExternalLink,
  FiImage,
  FiLock,
  FiMenu,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiSlack
} from 'react-icons/fi';

const surface = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
const control =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-800';

const PageIntro = ({ title, description, action, icon: Icon }) => (
  <div className='mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
    <div>
      <h2 className='text-xl font-bold tracking-tight'>{title}</h2>
      <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>{description}</p>
    </div>
    <button type='button' className='button inline-flex w-fit items-center gap-2 text-sm'>
      <Icon aria-hidden='true' /> {action}
    </button>
  </div>
);

const settingsSections = ['Details', 'Workflow', 'Issue types', 'Priorities', 'Labels', 'Access', 'Danger zone'];

const Field = ({ label, children, full = false }) => (
  <label className={`text-xs font-semibold text-slate-700 dark:text-slate-300 ${full ? 'sm:col-span-2' : ''}`}>
    {label}
    {children}
  </label>
);

const DetailsPanel = () => (
  <>
    <PanelHeading title='Project details' description='Names, defaults, and dates shown throughout the workspace.' />
    <div className='grid gap-4 sm:grid-cols-2'>
      <Field label='Project name'>
        <input className={control} defaultValue='Portfolio Website' />
      </Field>
      <Field label='Project key'>
        <input className={control} defaultValue='PORT' disabled />
      </Field>
      <Field label='Description' full>
        <textarea
          className={`${control} min-h-24 resize-y`}
          defaultValue='Website, publishing, issueboard, and platform work.'
        />
      </Field>
      <Field label='Default issue type'>
        <select className={control} defaultValue='Task'>
          <option>Task</option>
          <option>Story</option>
          <option>Bug</option>
          <option>Epic</option>
        </select>
      </Field>
      <Field label='Default priority'>
        <select className={control} defaultValue='Medium'>
          <option>Highest</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </Field>
    </div>
  </>
);

const workflowStatuses = [
  ['Backlog', 'Backlog', '—', 'bg-slate-400'],
  ['To do', 'To do', '8', 'bg-slate-500'],
  ['In progress', 'In progress', '4', 'bg-blue-500'],
  ['Review', 'In progress', '3', 'bg-amber-500'],
  ['Testing', 'In progress', '3', 'bg-violet-500'],
  ['Done', 'Done', '—', 'bg-emerald-500']
];

const WorkflowPanel = () => (
  <>
    <PanelHeading
      title='Workflow statuses'
      description='Control the order and work-in-progress limits used by sprint lanes.'
      action='Add status'
    />
    <div className='overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800'>
      {workflowStatuses.map(([name, category, limit, color]) => (
        <div
          key={name}
          className='grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-3 py-2.5 last:border-0 dark:border-slate-800 sm:grid-cols-[auto_auto_1fr_8rem_5rem]'
        >
          <FiMenu className='text-slate-400' aria-hidden='true' />
          <span className={`size-2.5 rounded-full ${color}`} />
          <strong className='text-sm'>{name}</strong>
          <span className='hidden text-xs text-slate-500 sm:block'>{category}</span>
          <span className='text-right text-xs text-slate-500'>WIP {limit}</span>
        </div>
      ))}
    </div>
  </>
);

const SimpleRows = ({ rows, action }) => (
  <div className='space-y-2'>
    {rows.map(({ name, detail, color }) => (
      <div
        key={name}
        className='flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-800'
      >
        <span className={`size-3 rounded-full ${color}`} />
        <div className='min-w-0 flex-1'>
          <strong className='block text-sm'>{name}</strong>
          <span className='text-xs text-slate-500'>{detail}</span>
        </div>
        <button
          type='button'
          className='rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
        >
          {action}
        </button>
      </div>
    ))}
  </div>
);

const PanelHeading = ({ title, description, action }) => (
  <div className='mb-5 flex items-start justify-between gap-3'>
    <div>
      <h3 className='font-bold'>{title}</h3>
      <p className='mt-1 text-sm text-slate-500'>{description}</p>
    </div>
    {action && (
      <button
        type='button'
        className='inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950'
      >
        <FiPlus /> {action}
      </button>
    )}
  </div>
);

const SettingsPanel = ({ section }) => {
  if (section === 'Details') return <DetailsPanel />;
  if (section === 'Workflow') return <WorkflowPanel />;
  if (section === 'Issue types')
    return (
      <>
        <PanelHeading
          title='Issue types'
          description='Choose the work types available when creating an issue.'
          action='Add type'
        />
        <SimpleRows
          action='Edit'
          rows={[
            { name: 'Task', detail: 'General work item', color: 'bg-blue-500' },
            { name: 'Story', detail: 'User-facing outcome', color: 'bg-emerald-500' },
            { name: 'Bug', detail: 'Unexpected behavior', color: 'bg-rose-500' },
            { name: 'Epic', detail: 'Large body of related work', color: 'bg-violet-500' }
          ]}
        />
      </>
    );
  if (section === 'Priorities')
    return (
      <>
        <PanelHeading
          title='Priorities'
          description='Order and color-code the urgency levels used by this project.'
          action='Add priority'
        />
        <SimpleRows
          action='Edit'
          rows={[
            { name: 'Highest', detail: 'Immediate attention', color: 'bg-rose-600' },
            { name: 'High', detail: 'Resolve soon', color: 'bg-orange-500' },
            { name: 'Medium', detail: 'Standard priority', color: 'bg-amber-500' },
            { name: 'Low', detail: 'Can wait', color: 'bg-sky-500' }
          ]}
        />
      </>
    );
  if (section === 'Labels')
    return (
      <>
        <PanelHeading
          title='Labels'
          description='Reusable categories. API-supplied unknown labels are created automatically.'
          action='Create label'
        />
        <SimpleRows
          action='Edit'
          rows={[
            { name: 'bug', detail: 'Defect or regression', color: 'bg-rose-500' },
            { name: 'enhancement', detail: 'Product improvement', color: 'bg-indigo-500' },
            { name: 'security', detail: 'Security-related work', color: 'bg-amber-500' },
            { name: 'documentation', detail: 'Content and guides', color: 'bg-teal-500' }
          ]}
        />
      </>
    );
  if (section === 'Access')
    return (
      <>
        <PanelHeading
          title='Project access'
          description='Access is enforced server-side and limited to approved identities.'
        />
        <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40'>
          <div className='flex gap-3'>
            <FiShield className='mt-0.5 shrink-0 text-emerald-700' />
            <div>
              <strong className='text-sm'>Administrator-only</strong>
              <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
                Google-authenticated administrators currently have full project access. Future roles remain
                project-scoped.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  return (
    <>
      <PanelHeading
        title='Danger zone'
        description='Irreversible project operations are isolated from ordinary settings.'
      />
      <div className='rounded-xl border border-rose-200 p-4 dark:border-rose-900'>
        <strong className='text-sm text-rose-700 dark:text-rose-300'>Archive this project</strong>
        <p className='mt-1 text-sm text-slate-500'>
          Hide the project and prevent new work while preserving issues and audit history.
        </p>
        <button
          type='button'
          className='mt-4 rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950'
        >
          Archive project
        </button>
      </div>
    </>
  );
};

export const ProjectSettingsView = () => {
  const [section, setSection] = useState('Details');
  return (
    <section>
      <PageIntro
        title='Project settings'
        description='Configure Portfolio Website without weakening shared security rules.'
        action='Save settings'
        icon={FiSave}
      />
      <div className='grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]'>
        <nav
          className={`${surface} flex gap-1 overflow-x-auto p-2 lg:block lg:space-y-1`}
          aria-label='Project settings sections'
        >
          {settingsSections.map((item) => (
            <button
              key={item}
              type='button'
              onClick={() => setSection(item)}
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition lg:w-full ${section === item ? (item === 'Danger zone' ? 'bg-rose-50 font-semibold text-rose-700 dark:bg-rose-950' : 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200') : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {item}
            </button>
          ))}
        </nav>
        <article className={`${surface} min-w-0 p-5 md:p-6`}>
          <SettingsPanel section={section} />
        </article>
      </div>
    </section>
  );
};

const HealthRow = ({ label, value, healthy = false }) => (
  <div className='flex items-center justify-between gap-4 border-t border-slate-100 py-2.5 text-sm first:border-0 dark:border-slate-800'>
    <span className='text-slate-500'>{label}</span>
    <strong
      className={`text-right text-xs ${healthy ? 'inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300' : ''}`}
    >
      {healthy && <FiCheck aria-hidden='true' />}
      {value}
    </strong>
  </div>
);

const IntegrationCard = ({ icon: Icon, name, description, status, statusTone = 'green', action, children }) => (
  <article className={`${surface} min-w-0 p-5`}>
    <div className='flex items-start justify-between gap-3'>
      <div className='flex min-w-0 gap-3'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
          <Icon />
        </span>
        <div>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone === 'green' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : statusTone === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {status}
          </span>
          <h3 className='mt-2 font-bold'>{name}</h3>
          <p className='mt-0.5 text-xs leading-5 text-slate-500'>{description}</p>
        </div>
      </div>
      <button
        type='button'
        disabled={status === 'Deferred'}
        className='shrink-0 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800'
      >
        {action}
      </button>
    </div>
    <div className='mt-5'>{children}</div>
  </article>
);

export const IntegrationsHealthView = () => (
  <section>
    <PageIntro
      title='Integrations and health'
      description='Private configuration state, capacity, and recovery guidance.'
      action='Run health check'
      icon={FiRefreshCw}
    />
    <div className='mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'>
      <FiAlertTriangle className='mt-0.5 shrink-0 text-xl' aria-hidden='true' />
      <div>
        <strong className='text-sm'>Free Plan availability</strong>
        <p className='mt-1 text-sm leading-5 text-amber-900/75 dark:text-amber-100/70'>
          Supabase can pause low-activity projects. Provider unavailability is shown as maintenance—not as an empty
          board. Upgrade for availability-sensitive use.
        </p>
      </div>
    </div>
    <div className='grid gap-4 xl:grid-cols-2'>
      <IntegrationCard
        icon={FiDatabase}
        name='Supabase'
        description='PostgreSQL and private issue attachments'
        status='Connected'
        action='Configure'
      >
        <div className='mb-4'>
          <div className='mb-2 flex justify-between text-xs'>
            <span className='text-slate-500'>Private storage</span>
            <strong>184 MB / 1 GB</strong>
          </div>
          <div className='h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
            <span className='block h-full w-[18.4%] rounded-full bg-emerald-500' />
          </div>
        </div>
        <HealthRow label='Database' value='Ready' healthy />
        <HealthRow label='Private bucket' value='Ready' healthy />
        <HealthRow label='Schema' value='v1 · current' />
        <HealthRow label='Last checked' value='Just now' />
      </IntegrationCard>
      <IntegrationCard
        icon={FiSlack}
        name='Slack'
        description='Structured issue creation from mobile and desktop'
        status='Connected'
        action='Configure'
      >
        <HealthRow label='Request signatures' value='Enforced' healthy />
        <HealthRow label='Allowed workspace' value='1 configured' />
        <HealthRow label='Allowed users' value='1 configured' />
        <HealthRow label='Last issue' value='PORT-74 · 2h ago' />
      </IntegrationCard>
      <IntegrationCard
        icon={FiImage}
        name='Image pipeline'
        description='Browser compression and signed direct uploads'
        status='Website'
        statusTone='blue'
        action='Test upload'
      >
        <HealthRow label='Compression target' value='1 MB / 1920 px' />
        <HealthRow label='Upload route' value='Direct' healthy />
        <HealthRow label='Pending cleanup' value='0 objects' />
      </IntegrationCard>
      <IntegrationCard
        icon={FiCloud}
        name='Discord'
        description='Optional adapter after Slack acceptance'
        status='Deferred'
        statusTone='gray'
        action='Not configured'
      >
        <HealthRow label='Runtime access' value='Disabled' />
        <HealthRow label='Priority' value='Future' />
      </IntegrationCard>
      <div className='xl:col-span-2'>
        <IntegrationCard
          icon={FiCode}
          name='Issue API'
          description='Create issues directly from approved services and automation'
          status='Planned'
          statusTone='blue'
          action='View specification'
        >
          <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.85fr)]'>
            <div>
              <div className='flex flex-wrap items-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 font-mono text-xs text-slate-100'>
                <span className='rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-300'>POST</span>
                <span>/api/issues</span>
              </div>
              <p className='mt-3 text-xs leading-5 text-slate-500'>
                Server-to-server requests will require a scoped credential, idempotency key, JSON content type, and
                project authorization. Credentials will never be exposed in browser code.
              </p>
              <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                <HealthRow label='Authentication' value='Bearer API key' />
                <HealthRow label='Idempotency' value='Required header' />
                <HealthRow label='Request format' value='application/json' />
                <HealthRow label='Attachment bytes' value='Not accepted' />
              </div>
            </div>
            <div>
              <h4 className='text-xs font-bold uppercase tracking-wide text-slate-500'>Request parameters</h4>
              <div className='mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800'>
                {[
                  ['projectKey', 'string', 'Required', 'Target project key'],
                  ['title', 'string', 'Required', 'Issue title'],
                  ['issueType', 'string', 'Required', 'Task, story, bug, or epic'],
                  ['description', 'markdown', 'Optional', 'Description and checklist'],
                  ['priority', 'string', 'Optional', 'Defaults to project setting'],
                  ['labels', 'string[]', 'Optional', 'Unknown labels are created'],
                  ['sprintId', 'uuid', 'Optional', 'Target sprint'],
                  ['parentIssueKey', 'string', 'Optional', 'Parent for a subtask'],
                  ['relationships', 'object[]', 'Optional', 'Links, blocks, or blocked by']
                ].map(([name, type, requirement, detail]) => (
                  <div
                    key={name}
                    className='grid grid-cols-[minmax(7rem,1fr)_auto] gap-x-3 border-b border-slate-100 px-3 py-2 last:border-0 dark:border-slate-800'
                  >
                    <code className='min-w-0 break-all text-xs font-semibold text-emerald-700 dark:text-emerald-300'>
                      {name}
                    </code>
                    <span
                      className={`text-[10px] font-bold ${requirement === 'Required' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-400'}`}
                    >
                      {requirement}
                    </span>
                    <span className='text-[10px] text-slate-400'>{type}</span>
                    <span className='text-right text-[10px] text-slate-500'>{detail}</span>
                  </div>
                ))}
              </div>
              <p className='mt-3 flex gap-2 text-xs leading-5 text-slate-500'>
                <FiLock className='mt-0.5 shrink-0' />
                Images will use the existing signed direct-upload authorization and finalize flow; image bodies will not
                pass through this API or Vercel functions.
              </p>
            </div>
          </div>
        </IntegrationCard>
      </div>
    </div>
    <div className={`${surface} mt-4 grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center`}>
      <div className='flex gap-3'>
        <FiShield className='mt-0.5 shrink-0 text-emerald-700' />
        <div>
          <strong className='text-sm'>Recovery checklist</strong>
          <p className='mt-1 text-sm text-slate-500'>
            Resume Supabase, verify schema and bucket access, then test one signed upload before reopening mutations.
          </p>
        </div>
      </div>
      <button
        type='button'
        className='inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950'
      >
        Open operations guide <FiExternalLink />
      </button>
    </div>
  </section>
);
