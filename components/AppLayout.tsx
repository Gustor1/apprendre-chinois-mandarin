'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

const navCategories: NavCategory[] = [
  {
    title: 'Apprendre',
    items: [
      { href: '/session', label: 'Session 15 Min', icon: '⚡' },
      { href: '/vocabulary', label: 'Vocabulaire', icon: '📚' },
      { href: '/grammar', label: 'Grammaire', icon: '🧩' },
      { href: '/conversational', label: 'Chinois Quotidien', icon: '🗣️' },
      { href: '/thematic', label: 'Thématiques', icon: '🏷️' },
    ],
  },
  {
    title: 'Réviser',
    items: [
      { href: '/practice', label: 'Révision Libre', icon: '🔄' },
      { href: '/favorites', label: 'Favoris', icon: '⭐' },
      { href: '/progress', label: 'Progression SRS', icon: '📈' },
    ],
  },
  {
    title: 'Autre',
    items: [
      { href: '/chat', label: 'Assistant IA', icon: '🤖' },
      { href: '/diagnostic', label: 'Diagnostic', icon: '🎯' },
      { href: '/', label: 'Dashboard', icon: '📊' },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [streakCount, setStreakCount] = useState<number | null>(null);

  // Charger le streak pour le header
  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.streak) {
          setStreakCount(data.streak.currentStreak || 0);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Fermer le tiroir mobile lors d'une navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <div className="app-shell">
      {/* Header épuré */}
      <header className="top-header">
        <div className="header-left">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Déplier la navigation' : 'Réduire la navigation'}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? '❯' : '❮'}
          </button>

          <button
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            title="Ouvrir le menu"
            aria-label="Toggle Mobile Menu"
          >
            ☰
          </button>

          <Link href="/" className="brand">
            <div className="brand-icon">汉</div>
            <span className="brand-text">Mandarin 15M</span>
          </Link>
        </div>

        <div className="header-right">
          {streakCount !== null && (
            <div className="streak-badge" title="Série de jours consécutifs">
              🔥 <span className="streak-num">{streakCount} {streakCount === 1 ? 'jour' : 'jours'}</span>
            </div>
          )}

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                🔑 Connexion (Sur Invitation)
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="app-body">
        {/* Mobile Backdrop */}
        {isMobileOpen && (
          <div className="mobile-backdrop" onClick={() => setIsMobileOpen(false)} />
        )}

        {/* Sidebar Verticale */}
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-scroll">
            {navCategories.map((cat) => (
              <div key={cat.title} className="sidebar-group">
                <div className="sidebar-group-title">{cat.title}</div>
                <div className="sidebar-group-items">
                  {cat.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content View */}
        <main className="main-content">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}
