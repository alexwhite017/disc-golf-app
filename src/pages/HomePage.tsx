import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold text-white mb-4">DiscTrack</h1>
      <p className="text-slate-400 text-lg mb-8 max-w-md">
        Track your rounds, manage your bag, and climb the leaderboard.
      </p>
      <div className="flex gap-3">
        <Link
          to="/courses"
          className="rounded-md bg-slate-800 px-5 py-2.5 text-white hover:bg-slate-700 transition-colors"
        >
          Browse Courses
        </Link>
        {user ? (
          <Link
            to="/rounds"
            className="rounded-md bg-green-600 px-5 py-2.5 text-white hover:bg-green-500 transition-colors"
          >
            My Rounds
          </Link>
        ) : (
          <Link
            to="/register"
            className="rounded-md bg-green-600 px-5 py-2.5 text-white hover:bg-green-500 transition-colors"
          >
            Get Started
          </Link>
        )}
      </div>
    </div>
  )
}
