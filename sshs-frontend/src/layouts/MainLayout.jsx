import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  HomeIcon,
  BookOpenIcon,
  ArchiveBoxIcon,
  AcademicCapIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
  DocumentChartBarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon }, // label changed, route unchanged
    { name: 'Assignments', href: '/assignments', icon: BookOpenIcon },
    { name: 'Materials', href: '/materials', icon: ArchiveBoxIcon },
    { name: 'Scores', href: '/scores', icon: ChartBarIcon },
    { name: 'Attendance', href: '/attendance', icon: UserCircleIcon },
    { name: 'Permit', href: '/permit', icon: ClipboardDocumentCheckIcon },
    // CRITIQUE: VISIBLE ONLY TO STUDENTS AND ADMINS (Hidden for Teachers)
    ...(user?.role !== 'teacher'
      ? [
          {
            name: 'Critique',
            href: '/critique',
            icon: ChatBubbleBottomCenterTextIcon,
          },
        ]
      : []),

    ...(user?.role !== 'teacher'
      ? [
          {
            name: 'Scholarship',
            href: '/scholarship',
            icon: AcademicCapIcon,
          },
        ]
      : []),

    ...(user?.role !== 'teacher'
      ? [
          {
            name: 'Fee Relief',
            href: '/fee-relief',
            icon: BanknotesIcon,
          },
        ]
      : []),

    { name: 'Penalty', href: '/penalty', icon: ExclamationTriangleIcon },

    // REPORTS: VISIBLE ONLY TO ADMIN
    ...(user?.role === 'admin'
      ? [
          {
            name: 'Reports',
            href: '/reports',
            icon: DocumentChartBarIcon,
          },
        ]
      : []),

    {
      name: user?.role === 'admin' ? 'Manage' : 'Profile',
      href: '/profile',
      icon: Cog6ToothIcon,
    },
  ];

  return (
    <div className="relative flex min-h-screen text-white overflow-hidden">
      {/* Refraction / dispersion overlay over bg.jpg */}
      

      {/* Main shell */}
      <div className="relative z-10 flex w-full max-w-6xl mx-auto min-h-screen px-4 py-6 gap-4">
        {/* Desktop sidebar */}
        <aside
          className="
            hidden md:flex flex-col
            w-64
            rounded-[2rem]
            border border-white/25
            bg-white/[0.035]
            backdrop-blur-[10px]
            shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
            overflow-hidden
            animate-glass
          "
        >
          {/* Logo area */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/15">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/30 bg-white/[0.08] shadow-[inset_0_0_14px_rgba(255,255,255,0.2)] backdrop-blur-[8px]">
                <ShieldCheckIcon className="h-5 w-5 text-white/90" />
              </div>
              <div>
                <h1 className="text-base font-semibold leading-tight">
                  SSHS Portal
                </h1>
                <p className="text-[11px] text-white/60">
                  St. Stanislaus High School
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    [
                      'flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-all',
                      'border',
                      isActive
                        ? 'border-white/40 bg-white/[0.12] text-white shadow-[inset_0_0_18px_rgba(255,255,255,0.28)]'
                        : 'border-transparent text-white/70 hover:text-white hover:bg-white/[0.06] hover:border-white/25 hover:shadow-[inset_0_0_14px_rgba(255,255,255,0.18)]',
                    ].join(' ')
                  }
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main content card */}
        <section
          className="
            flex flex-1 flex-col
            rounded-[2rem]
            border border-white/25
            bg-white/[0.03]
            backdrop-blur-[10px]
            shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
            overflow-hidden
            animate-glass
          "
        >
          {/* Top bar */}
          <header className="flex items-center justify-between gap-4 border-b border-white/15 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="truncate">
                <p className="text-sm font-medium leading-tight">
                  Welcome, {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-white/60">
                  {user?.role === 'admin'
                    ? 'Admin portal'
                    : user?.role === 'teacher'
                    ? 'Teacher portal'
                    : 'Student portal'}
                </p>
              </div>
            </div>

            {/* Top bar logout for small screens */}
            <button
              onClick={handleLogout}
              className="
                h-11 inline-flex items-center gap-2
                rounded-full border border-white/30
              bg-white/[0.12] px-4
                text-sm text-white
              hover:bg-white/[0.18]
              "
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto px-5 py-5 pb-24 md:pb-6">
            <Outlet />
          </main>
        </section>
      </div>

      {/* Mobile bottom nav – horizontally scrollable, equal-width tabs */}
      <nav
        className="
          fixed inset-x-0 bottom-4 z-20 mx-auto w-[94%] max-w-xl
          md:hidden
          rounded-[2rem]
          border border-white/25
          bg-white/[0.08]
          backdrop-blur-[10px]
          shadow-[inset_0_0_20px_rgba(255,255,255,0.22)]
          px-2 py-2
          overflow-x-auto
          whitespace-nowrap
          animate-glass
        "
      >
        <div className="inline-flex items-center gap-1 min-w-full">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                [
                  'flex flex-none flex-col items-center justify-center rounded-2xl px-2 py-1.5 text-[10px] font-medium transition-all',
                  'w-24', // equal visual width for each tab
                  isActive
                    ? 'bg-white/[0.18] text-white shadow-[inset_0_0_16px_rgba(255,255,255,0.3)]'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.08]',
                ].join(' ')
              }
            >
              <item.icon className="mb-0.5 h-4 w-4" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;