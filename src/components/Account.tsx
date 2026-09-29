import type { Session } from '@supabase/supabase-js'
import { ArrowUpRight } from 'lucide-react'
import { supabase } from '../supabase'

export default function Account({ session }: { session: Session }) {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-6 pt-8 md:px-0">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-6 font-display text-3xl tracking-tighter text-accent md:text-4xl break-all">
          {session.user.email}
        </p>
        <p className="mt-2 text-sm text-muted">Signed in on this device.</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-12 flex w-full items-center justify-between bg-white px-5 py-4 font-display text-sm font-semibold uppercase tracking-widest text-black active:bg-accent"
        >
          Sign out
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
