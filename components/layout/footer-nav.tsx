//footer-nav.tsx

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ScrollText, PlusCircle, Bell, User } from 'lucide-react'; // Removed Map import

const navItems = [
  { icon: Home, label: 'Feed', href: '/feed' },
  { icon: ScrollText, label: 'Board', href: '/footprint' },
  { icon: PlusCircle, label: 'Create', href: '/create' },
  { icon: Bell, label: 'Inbox', href: '/inbox' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export function FooterNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800">
      <div className="max-w-lg mx-auto px-4">
        <nav className="flex justify-between py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-3 py-2 rounded-xl transition-colors
                  ${
                    isActive
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-white'
                  }
                `}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
