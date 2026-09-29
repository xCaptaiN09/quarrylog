import type { Session } from '@supabase/supabase-js'
import { ArrowUpRight } from 'lucide-react'
import { supabase } from '../supabase'

export default function Account({ session }: { session: Session }) {
  return (
    <div className="flex min-h-[70dvh] flex-col justify-between px-6 pt-8 md:px-0 md:pt-0">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-6 font-display text-3xl tracking-tighter text-accent md:text-5xl">
          {session.user.email}
        </p>
        <p className="mt-2 text-sm text-muted">Signed in on this device.</p>
      </div>
      <button
        onClick={() => supabase.auth.signOut()}
        className="mb-8 flex w-full items-center justify-between bg-white px-5 py-4 font-display text-sm font-semibold uppercase tracking-widest text-black active:bg-accent md:max-w-sm"
      >
        Sign out
        <ArrowUpRight size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}
