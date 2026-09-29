import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { LucideIcon } from 'lucide-react'
import { LayoutGrid, History as HistoryIcon, User } from 'lucide-react'
import { supabase } from './supabase'
import Login from './components/Login'
import Today from './components/Today'
import History from './components/History'
import Account from './components/Account'

type Tab = 'today' | 'history' | 'account'

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', icon: LayoutGrid },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'account', label: 'Account', icon: User },
]

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [tab, setTab] = useState<Tab>('today')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Login />

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[430px] bg-bg sm:border-x sm:border-line md:max-w-none md:border-x-0 md:px-12 lg:px-24">
      <header className="hidden items-center justify-between py-6 md:flex">
        <span className="font-display text-lg font-semibold tracking-tight">Quarrylog</span>
        <nav className="flex gap-8">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`text-xs uppercase tracking-widest ${
                tab === id ? 'text-accent' : 'text-muted hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      <div className="pb-24 md:pb-16">
        {tab === 'today' && <Today />}
        {tab === 'history' && <History />}
        {tab === 'account' && <Account session={session} />}
      </div>
      <nav className="fixed bottom-0 left-1/2 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-3 border-t border-line bg-bg md:hidden">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 py-3 text-[11px] uppercase tracking-widest ${
              tab === id ? 'text-accent' : 'text-muted'
            }`}
          >
            <Icon size={20} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
