import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminActivityRail from './AdminActivityRail';
import AdminContextSidebar from './AdminContextSidebar';
import AdminHorizonHeader from './AdminHorizonHeader';
import AdminSpatialPalette from './AdminSpatialPalette';
import QuickAddModal from './QuickAddModal';

export const AdminLayout = ({
  children,
  title = 'Admin Command Center | SinghBuildsTech',
  description = 'Private SinghBuildsTech administration console.',
  adminEmail = '',
  defaultSidebarExpanded = true
}) => {
  const router = useRouter();
  const [sidebarExpanded, setSidebarExpanded] = useState(defaultSidebarExpanded);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState('issue');

  // Load sidebar preference from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('sb_admin_sidebar_expanded');
      if (saved !== null) {
        setSidebarExpanded(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('sb_admin_sidebar_expanded', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleOpenQuickAdd = (mode = 'issue') => {
    if (mode === 'article') {
      router.push('/admin/articles/new');
      return;
    }
    setQuickAddMode(mode || 'issue');
    setQuickAddOpen(true);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ⌘K or Ctrl+K -> Command Palette (Artefact 5)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      // ⌥B or Alt+B -> Toggle Context Sidebar
      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleToggleSidebar();
        return;
      }

      // ⌘1, ⌘2, ⌘3 -> Direct Domain Switches
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '1') {
          e.preventDefault();
          router.push('/admin/articles/new');
        } else if (e.key === '2') {
          e.preventDefault();
          router.push('/admin/issues');
        } else if (e.key === '3') {
          e.preventDefault();
          router.push('/admin/books');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className='flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200'>
      <Head>
        <title>{title}</title>
        <meta name='description' content={description} />
        <meta name='robots' content='noindex, nofollow, noarchive' />
      </Head>

      {/* TIER 1: 54px Iconic Activity Rail (Artefact 3) */}
      <AdminActivityRail sidebarExpanded={sidebarExpanded} onToggleSidebar={handleToggleSidebar} />

      {/* TIER 2: 230px Contextual Shelf & Sub-tree Drawer (Artefact 3) */}
      <AdminContextSidebar expanded={sidebarExpanded} onOpenQuickAdd={handleOpenQuickAdd} />

      {/* MAIN VIEWPORT CANVAS */}
      <div className='flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-950'>
        {/* TOP: Horizon Glass Panoramic Header (Artefact 4) */}
        <AdminHorizonHeader
          adminEmail={adminEmail}
          onOpenCommandPalette={() => setPaletteOpen(true)}
          onOpenQuickAdd={handleOpenQuickAdd}
        />

        {/* CONTENT CANVAS */}
        <main className='relative flex-1 overflow-y-auto bg-slate-950/60'>{children}</main>
      </div>

      {/* SPATIAL COMMAND PALETTE & 3D SWITCHER MODAL (Artefact 5: ⌘K) */}
      <AdminSpatialPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenQuickAdd={handleOpenQuickAdd}
      />

      {/* UNIFIED QUICK ADD MODAL */}
      <QuickAddModal isOpen={quickAddOpen} initialMode={quickAddMode} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
};

export default AdminLayout;
