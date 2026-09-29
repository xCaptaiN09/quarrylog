import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Invalid email or password.')
    setLoading(false)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-between bg-bg p-8 sm:border-x sm:border-line">
      <span className="text-xs uppercase tracking-[0.3em] text-muted">Quarrylog</span>
      <h1 className="font-display text-6xl leading-[0.95] tracking-tighter">
        Welcome
        <br />
        <span className="text-accent">Sign in</span>
      </h1>
      <form onSubmit={submit}>
        <p className="mb-6 text-sm leading-snug text-muted">
          Sign in to log lorry loads
          <br />
          at the quarry.
        </p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-b border-line bg-transparent py-4 text-base text-white outline-none placeholder:text-[#3F3F3F] focus:border-accent"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-b border-line bg-transparent py-4 text-base text-white outline-none placeholder:text-[#3F3F3F] focus:border-accent"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-between bg-white px-5 py-4 font-display text-sm font-semibold uppercase tracking-widest text-black active:bg-accent disabled:opacity-50"
        >
          {loading ? 'Signing in' : 'Sign in'}
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </button>
        {error && <p className="mt-3 text-sm text-accent">{error}</p>}
      </form>
    </div>
  )
}
