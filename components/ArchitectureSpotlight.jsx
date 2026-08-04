import React, { useState } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { FaCubes, FaNetworkWired, FaServer, FaShieldHalved } from 'react-icons/fa6';
import { MdOutlineArchitecture, MdMemory, MdSpeed } from 'react-icons/md';

const architectureBlueprints = [
  {
    id: 'lingora-ai-platform',
    titleKey: 'blueprint4Title',
    defaultTitle: 'Lingora AI-Native Local-First Architecture',
    categoryKey: 'blueprint4Cat',
    defaultCategory: 'AI & Local-First Platform',
    icon: FaCubes,
    summaryKey: 'blueprint4Summary',
    defaultSummary:
      'Cross-platform AI language learning platform featuring local-first SQLite sync, German morphological parsing, and FSRS spaced repetition.',
    nodes: [
      { id: 'mining', label: 'Context Capture / Mining', detail: 'Clipboard & Web Content Importer' },
      { id: 'parser', label: 'Morphology Engine', detail: 'German Lemmatizer & Semantic Clusters' },
      { id: 'fsrs', label: 'Local SQLite & FSRS Scheduler', detail: 'Offline Spaced-Repetition Cache' },
      { id: 'ai', label: 'LLM Generation & Sync', detail: 'Validated AI Prompts & Conflict-free Sync' }
    ],
    highlightsKey: 'blueprint4Highlights',
    defaultHighlights: [
      'Local-first offline availability with conflict-free background synchronization',
      'Optimized FSRS spaced-repetition memory scheduling engine',
      'German morphology & semantic concept clustering for deep contextual acquisition'
    ]
  },
  {
    id: 'distributed-microservices',
    titleKey: 'blueprint1Title',
    defaultTitle: 'Distributed Service Mesh & Microservices',
    categoryKey: 'blueprint1Cat',
    defaultCategory: 'Distributed Systems',
    icon: FaCubes,
    summaryKey: 'blueprint1Summary',
    defaultSummary:
      'High-throughput, event-driven microservices architecture with gRPC inter-service communication and Redis caching.',
    nodes: [
      { id: 'client', label: 'API Gateway / Edge', detail: 'FastAPI / Envoy Reverse Proxy' },
      { id: 'auth', label: 'Auth & Access Service', detail: 'OAuth2 / JWT Token Validation' },
      { id: 'mesh', label: 'gRPC Service Mesh', detail: 'Actix-Web & Rust Microservices' },
      { id: 'data', label: 'Persistence Layer', detail: 'PostgreSQL + Redis Cache' }
    ],
    highlightsKey: 'blueprint1Highlights',
    defaultHighlights: [
      'Sub-millisecond inter-service latency via gRPC protocol buffers',
      'Fault isolation and automated circuit breaking',
      'Event streaming with Apache Kafka for asynchronous processing'
    ]
  },
  {
    id: 'embedded-can-bus',
    titleKey: 'blueprint2Title',
    defaultTitle: 'Medical Device CAN Bus & Signal Processing',
    categoryKey: 'blueprint2Cat',
    defaultCategory: 'Embedded & Medical Systems',
    icon: MdMemory,
    summaryKey: 'blueprint2Summary',
    defaultSummary:
      'Real-time CAN bus communication & signal decoding architecture for high-reliability medical devices.',
    nodes: [
      { id: 'sensor', label: 'Medical Hardware Sensors', detail: 'CAN Bus Transceiver & Device Nodes' },
      { id: 'decoder', label: 'Rust Native Parser', detail: 'Bit-level DBC Profile Decoder' },
      { id: 'buffer', label: 'Lock-free Ring Buffer', detail: 'Zero-copy Frame Storage' },
      { id: 'ui', label: 'Desktop Diagnostic Workbench', detail: 'Tauri + React High-FPS Render' }
    ],
    highlightsKey: 'blueprint2Highlights',
    defaultHighlights: [
      'Zero-copy memory pipelines for 100% packet retention during diagnostic streaming',
      'Real-time DBC signal decoding and trace recording for medical devices',
      'Cross-platform Rust core with lightweight Tauri GUI frontend'
    ]
  },
  {
    id: 'high-frequency-pipeline',
    titleKey: 'blueprint3Title',
    defaultTitle: 'Low-Latency Trading & Data Pipeline',
    categoryKey: 'blueprint3Cat',
    defaultCategory: 'Performance Engineering',
    icon: MdSpeed,
    summaryKey: 'blueprint3Summary',
    defaultSummary:
      'Performance-critical data pipeline optimized for low-jitter packet processing and instant execution.',
    nodes: [
      { id: 'socket', label: 'Raw TCP / UDP Sockets', detail: 'Kernel Bypass Packet Capture' },
      { id: 'engine', label: 'C++ Order Engine', detail: 'Cache-aligned Data Structures' },
      { id: 'store', label: 'In-Memory Store', detail: 'Ultra-low Latency Key-Value Engine' },
      { id: 'audit', label: 'Audit & Compliance Log', detail: 'Asynchronous Persistent Logger' }
    ],
    highlightsKey: 'blueprint3Highlights',
    defaultHighlights: [
      'Cache-conscious C++ memory alignment avoiding heap allocation spikes',
      'Predictable deterministic execution times for high-frequency workloads',
      'Comprehensive telemetry and Wireshark-compatible packet inspection'
    ]
  }
];

const ArchitectureSpotlight = () => {
  const { t } = useLanguage();
  const [activeBlueprint, setActiveBlueprint] = useState(architectureBlueprints[0]);

  return (
    <section
      id='architecture-spotlight'
      className='relative py-14 md:py-20 bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white overflow-hidden isolate transition-colors duration-200'
    >
      {/* Background ambient lighting */}
      <div className='absolute -top-32 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl' />
      <div className='absolute -bottom-32 right-10 -z-10 h-96 w-96 rounded-full bg-green-500/10 blur-3xl' />

      <div className='mx-auto w-full max-w-[1048px] px-4 lg:px-8'>
        <header className='mx-auto mb-10 max-w-3xl text-center md:mb-12'>
          <p className='mb-2 font-Monda text-sm font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400'>
            {t('architectureSpotlight.subtitle', 'Interactive Architecture Blueprint')}
          </p>
          <h2 className='mb-3 font-Neuton text-4xl font-semibold leading-tight md:text-5xl'>
            {t('architectureSpotlight.title', 'System Design & Architecture Spotlight')}
          </h2>
          <p className='mx-auto mb-0 max-w-2xl text-slate-600 dark:text-slate-300'>
            {t(
              'architectureSpotlight.desc',
              'Explore interactive blueprints showing how I structure distributed platforms, embedded systems, and low-latency pipelines.'
            )}
          </p>
        </header>

        {/* Blueprint Selector Tabs */}
        <div className='mb-8 flex flex-wrap items-center justify-center gap-3'>
          {architectureBlueprints.map((blueprint) => {
            const Icon = blueprint.icon;
            const isActive = activeBlueprint.id === blueprint.id;
            return (
              <button
                type='button'
                key={blueprint.id}
                onClick={() => setActiveBlueprint(blueprint)}
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 font-Monda text-sm font-bold transition duration-200 ${
                  isActive
                    ? 'border-orange-500 bg-white text-orange-600 dark:bg-slate-800 dark:text-orange-400 shadow-lg ring-2 ring-orange-500/30'
                    : 'border-slate-300 bg-white/70 text-slate-700 hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800'
                }`}
              >
                <Icon aria-hidden='true' className='text-lg' />
                <span>{t(`architectureSpotlight.${blueprint.titleKey}`, blueprint.defaultTitle)}</span>
              </button>
            );
          })}
        </div>

        {/* Active Blueprint Visualization Canvas */}
        <div className='overflow-hidden rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800/80 backdrop-blur-sm md:p-8'>
          <div className='mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-6 md:flex-row md:items-center'>
            <div>
              <span className='rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 font-Monda text-xs font-bold text-orange-600 dark:text-orange-400'>
                {t(`architectureSpotlight.${activeBlueprint.categoryKey}`, activeBlueprint.defaultCategory)}
              </span>
              <h3 className='mt-2 font-Neuton text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl'>
                {t(`architectureSpotlight.${activeBlueprint.titleKey}`, activeBlueprint.defaultTitle)}
              </h3>
            </div>
            <p className='max-w-md text-sm text-slate-600 dark:text-slate-300'>
              {t(`architectureSpotlight.${activeBlueprint.summaryKey}`, activeBlueprint.defaultSummary)}
            </p>
          </div>

          {/* Interactive Flow Nodes */}
          <div className='my-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {activeBlueprint.nodes.map((node, index) => (
              <div
                key={node.id}
                className='relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90 transition duration-300 hover:border-orange-500/60 hover:shadow-lg'
              >
                <div>
                  <div className='mb-2 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400'>
                    <span>Node 0{index + 1}</span>
                    <span className='size-2 rounded-full bg-green-500 animate-pulse' />
                  </div>
                  <h4 className='font-Monda text-base font-bold text-slate-900 dark:text-white'>
                    {t(`architectureSpotlight.${activeBlueprint.id}.nodes.${index}.label`, node.label)}
                  </h4>
                  <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
                    {t(`architectureSpotlight.${activeBlueprint.id}.nodes.${index}.detail`, node.detail)}
                  </p>
                </div>
                {index < activeBlueprint.nodes.length - 1 && (
                  <div className='hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-orange-500 font-bold text-lg'>
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Architectural Key Highlights */}
          <div className='rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-700/60 dark:bg-slate-900/40 p-4 md:p-5'>
            <h4 className='mb-3 font-Monda text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
              {t('architectureSpotlight.highlightsHeader', 'Key Architectural Benefits')}
            </h4>
            <ul className='m-0 grid list-none gap-2 p-0 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-3'>
              {t(`architectureSpotlight.${activeBlueprint.highlightsKey}`, activeBlueprint.defaultHighlights).map(
                (highlight, i) => (
                  <li key={i} className='flex items-start gap-2'>
                    <span className='mt-1 text-xs text-green-600 dark:text-green-400'>✓</span>
                    <span>{highlight}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSpotlight;
