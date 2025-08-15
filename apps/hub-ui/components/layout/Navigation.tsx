'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/devices', label: 'Devices', icon: '🤖' },
  { href: '/flows', label: 'Flows', icon: '📊' },
  { href: '/system', label: 'System', icon: '🔧' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-tafy-700">
                Tafy Studio
              </span>
            </Link>

            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-tafy-100 text-tafy-900'
                          : 'text-gray-700 hover:bg-tafy-50 hover:text-tafy-900'
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className="flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                <span className="text-sm font-medium text-gray-700">
                  Connected
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
