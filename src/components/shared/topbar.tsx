'use client'

import { LogOut, Moon, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'
import { useAppStore } from '@/store/app.store'
import { ExerciceSelector } from './exercice-selector'

export function Topbar() {
  const router = useRouter()
  const { theme, setTheme } = useAppStore()

  async function handleLogout() {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4">
      <div className="text-sm font-medium text-gray-700">
        {/* Nom entreprise — sera dynamique */}
      </div>

      <ExerciceSelector />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
