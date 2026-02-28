import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api/auth'
import { AxiosError } from 'axios'

export default function ProfilePage() {
  const { user, login } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [infoSuccess, setInfoSuccess] = useState(false)
  const [infoError, setInfoError] = useState<string | null>(null)
  const [infoSaving, setInfoSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaving, setPwSaving] = useState(false)

  const handleInfoSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setInfoError(null)
    setInfoSuccess(false)
    setInfoSaving(true)
    try {
      await updateProfile({ name, email })
      setInfoSuccess(true)
    } catch (err) {
      const msg = err instanceof AxiosError
        ? err.response?.data?.message ?? 'Failed to update profile.'
        : 'Failed to update profile.'
      setInfoError(msg)
    } finally {
      setInfoSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)
    if (password !== passwordConfirmation) return setPwError('Passwords do not match.')
    setPwSaving(true)
    try {
      await updateProfile({ current_password: currentPassword, password, password_confirmation: passwordConfirmation })
      setPwSuccess(true)
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      const msg = err instanceof AxiosError
        ? err.response?.data?.message ?? 'Failed to update password.'
        : 'Failed to update password.'
      setPwError(msg)
    } finally {
      setPwSaving(false)
    }
  }

  const inputClass = 'w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none'

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>

      <div className="rounded-lg bg-slate-800 border border-slate-700 p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4">Account info</h2>
        {infoSuccess && <div className="mb-4 rounded-md bg-green-900/40 border border-green-700 px-4 py-3 text-sm text-green-300">Profile updated.</div>}
        {infoError && <div className="mb-4 rounded-md bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">{infoError}</div>}
        <form onSubmit={handleInfoSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
          </div>
          <button type="submit" disabled={infoSaving} className="rounded-md bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-500 transition-colors disabled:opacity-50">
            {infoSaving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="rounded-lg bg-slate-800 border border-slate-700 p-6">
        <h2 className="text-base font-semibold text-white mb-4">Change password</h2>
        {pwSuccess && <div className="mb-4 rounded-md bg-green-900/40 border border-green-700 px-4 py-3 text-sm text-green-300">Password updated.</div>}
        {pwError && <div className="mb-4 rounded-md bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">{pwError}</div>}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Confirm new password</label>
            <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required className={inputClass} />
          </div>
          <button type="submit" disabled={pwSaving} className="rounded-md bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-500 transition-colors disabled:opacity-50">
            {pwSaving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
