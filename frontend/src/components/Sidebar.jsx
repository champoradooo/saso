import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Scale,
  CalendarDays,
  FileText,
  UserCog,
  LogOut,
  Search,
} from 'lucide-react'

import octLogo from '@/assets/oct-logo.png'
import { useAuth } from '@/context/AuthContext'

const nav = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/students',
    label: 'Student Records',
    icon: Users,
  },
  {
    to: '/discipline',
    label: 'Discipline',
    icon: Scale,
  },
  {
    to: '/activities',
    label: 'Activities',
    icon: CalendarDays,
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: FileText,
  },
  {
    to: '/lost-found',
    label: 'Lost & Found',
    icon: Search,
  },
]

const ROLE_LABELS = {
  admin: 'Administrator',
  staff: 'Staff',
}

export default function Sidebar() {
  const { user, logout } = useAuth()

  // Normalize the logged-in user's role.
  const role = String(user?.role ?? '')
    .trim()
    .toLowerCase()

  // Only administrators can manage user accounts.
  const canManageUsers = role === 'admin'

  const displayName =
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    user?.username ||
    'Current User'

  const displayRole = ROLE_LABELS[role] || role || 'User'

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground sticky top-0">

      {/* LOGO AND OFFICE NAME */}
      <div className="border-b border-sidebar-border px-5 py-5">
        <div className="flex items-center gap-3">
          <img
            src={octLogo}
            alt="Olivarez College Tagaytay Logo"
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />

          <div className="min-w-0">
            <p className="text-[12px] font-bold leading-tight">
              Olivarez College
            </p>

            <p className="text-[11px] leading-tight text-sidebar-foreground/60">
              Tagaytay
            </p>
          </div>
        </div>

        <div className="mt-3 px-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider leading-none text-sidebar-primary">
            SASO
          </p>

          <p className="mt-1 text-[10px] leading-snug text-sidebar-foreground/50">
            Student Affairs and Services Office
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Menu
        </p>

        {/* MAIN MENU ITEMS */}
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sidebar-primary text-white shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* ADMINISTRATION */}
        {canManageUsers && (
          <>
            <p className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Administration
            </p>

            <NavLink
              to="/users"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-sidebar-primary text-white shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )
              }
            >
              <UserCog className="h-4 w-4 shrink-0" />
              <span>User Management</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* CURRENT USER AND LOGOUT */}
      <div className="shrink-0 border-t border-sidebar-border px-5 py-4">
        {user && (
          <div className="mb-3 min-w-0">
            <p className="truncate text-[12px] font-semibold leading-tight">
              {displayName}
            </p>

            <p className="mt-1 truncate text-[11px] leading-snug text-sidebar-foreground/50">
              {displayRole}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 text-[12px] font-medium text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}