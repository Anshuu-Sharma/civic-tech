'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Mic } from 'lucide-react';

const NAV_LINKS = [
  { href: '/file-complaint', label: 'File Complaint' },
  { href: '/track', label: 'Track' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/voice-assistant', label: 'Voice', icon: Mic },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-civic-900 text-lg tracking-tight">JanSunwai</span>
            <span className="text-saffron-500 font-bold text-lg ml-0.5">AI</span>
          </div>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 transition-colors ${
                  isActive
                    ? 'text-saffron-600 font-semibold'
                    : 'hover:text-saffron-600'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {link.label}
              </Link>
            );
          })}
        </div>
        <Link href="/file-complaint" className="bg-saffron-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-saffron-600 transition-colors">
          File Now
        </Link>
      </div>
    </nav>
  );
}
