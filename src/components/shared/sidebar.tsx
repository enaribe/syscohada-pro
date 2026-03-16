'use client'

import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  BookText,
  Bot,
  Building,
  Building2,
  Calendar,
  FileText,
  FolderLock,
  LayoutDashboard,
  Lock,
  Repeat,
  Scale,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: 'Comptabilité',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/journal', label: 'Journal', icon: BookOpen },
      { href: '/balance', label: 'Balance', icon: Scale },
      { href: '/grand-livre', label: 'Grand livre', icon: BookText },
      { href: '/etats-financiers', label: 'États financiers', icon: BarChart3 },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { href: '/immobilisations', label: 'Immobilisations', icon: Building2 },
      { href: '/tresorerie', label: 'Trésorerie', icon: TrendingUp },
      { href: '/rapprochement', label: 'Rapprochement', icon: ArrowLeftRight },
      { href: '/liasse-fiscale', label: 'Liasse fiscale', icon: FileText },
      { href: '/cloture', label: 'Clôture', icon: Lock },
      { href: '/recurrentes', label: 'Récurrentes', icon: Repeat },
      { href: '/relances', label: 'Relances', icon: Bell },
      { href: '/coffre-fort', label: 'Coffre-fort', icon: FolderLock },
    ],
  },
  {
    label: 'Assistance & Admin',
    items: [
      { href: '/expert-ia', label: 'Expert IA', icon: Bot },
      { href: '/exercices', label: 'Exercices', icon: Calendar },
      { href: '/profil-entreprise', label: 'Profil entreprise', icon: Building },
      { href: '/utilisateurs', label: 'Utilisateurs', icon: Users },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 border-r bg-white flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg text-blue-700">SYSCOHADA Pro</h1>
      </div>

      <nav className="flex-1 p-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
