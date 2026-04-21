import { Outlet, NavLink } from 'react-router-dom';
import { COMPANIES } from '../../lib/constants.js';
import BottomNav from './BottomNav.jsx';

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex-col">
        <div className="px-4 py-5 border-b border-slate-800">
          <h1 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
            Command Dashboard
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/backlog"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`
            }
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Backlog
          </NavLink>
          <NavLink
            to="/people"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`
            }
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            People
          </NavLink>
          <div className="pt-4 pb-1 px-3">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Companies</span>
          </div>
          {COMPANIES.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-2 px-3 py-2 rounded text-sm text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              {c.name}
            </div>
          ))}
        </nav>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-auto pb-14 md:pb-0">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
