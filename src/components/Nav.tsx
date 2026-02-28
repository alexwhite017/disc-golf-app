import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-green-400 font-semibold'
    : 'text-slate-300 hover:text-white transition-colors'

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-3 text-sm border-b border-slate-800 ${
    isActive ? 'text-green-400 font-semibold' : 'text-slate-300'
  }`

export default function Nav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="mx-auto max-w-6xl px-4 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="text-white font-bold text-lg tracking-tight" onClick={closeMenu}>
            DiscTrack
          </NavLink>
          <div className="hidden sm:flex items-center gap-5 text-sm">
            <NavLink to="/courses" className={linkClass}>Courses</NavLink>
            <NavLink to="/leaderboard" className={linkClass}>Leaderboard</NavLink>
            {user && (
              <>
                <NavLink to="/rounds" className={linkClass}>Rounds</NavLink>
                <NavLink to="/bag" className={linkClass}>Bag</NavLink>
                <NavLink to="/stats" className={linkClass}>Stats</NavLink>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <NavLink
                to="/profile"
                className="hidden sm:block text-slate-400 hover:text-white transition-colors"
              >
                {user.name}
              </NavLink>
              <button
                onClick={handleLogout}
                className="hidden sm:block rounded-md bg-slate-800 px-3 py-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="hidden sm:block text-slate-300 hover:text-white transition-colors">
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="hidden sm:block rounded-md bg-green-600 px-3 py-1.5 text-white hover:bg-green-500 transition-colors"
              >
                Register
              </NavLink>
            </>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="sm:hidden flex flex-col gap-1 p-2"
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-slate-300 transition-all ${menuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-slate-300 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-slate-300 transition-all ${menuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-slate-900 border-t border-slate-800">
          <NavLink to="/courses" className={mobileLinkClass} onClick={closeMenu}>Courses</NavLink>
          <NavLink to="/leaderboard" className={mobileLinkClass} onClick={closeMenu}>Leaderboard</NavLink>
          {user ? (
            <>
              <NavLink to="/rounds" className={mobileLinkClass} onClick={closeMenu}>Rounds</NavLink>
              <NavLink to="/bag" className={mobileLinkClass} onClick={closeMenu}>Bag</NavLink>
              <NavLink to="/stats" className={mobileLinkClass} onClick={closeMenu}>Stats</NavLink>
              <NavLink to="/profile" className={mobileLinkClass} onClick={closeMenu}>{user.name} — Profile</NavLink>
              <button
                onClick={() => { handleLogout(); closeMenu() }}
                className="block w-full text-left px-4 py-3 text-sm text-slate-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={mobileLinkClass} onClick={closeMenu}>Login</NavLink>
              <NavLink to="/register" className={mobileLinkClass} onClick={closeMenu}>Register</NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
