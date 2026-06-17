'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, Info, Lock, Wallet, Sparkles } from 'lucide-react';

const MENU = [
  { href: '/', label: 'Beranda', icon: Home, desc: 'Rekap iuran & metode pembayaran' },
  { href: '/tentang', label: 'Tentang Kami', icon: Info, desc: 'Tema, tujuan & susunan panitia' },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 border-b border-red-100">
      <div className="container mx-auto px-3 py-2.5 flex items-center justify-between gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-red-700 hover:bg-red-50 -ml-1">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-gradient-to-b from-white via-red-50/30 to-green-50/30 p-0">
            <SheetHeader className="p-5 bg-gradient-to-br from-red-600 to-red-800 text-white text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/30 shadow-lg flex-shrink-0">
                  <Image src="/assets/logo.jpg" alt="LIPPO 13" width={48} height={48} className="object-cover w-full h-full" />
                </div>
                <div>
                  <SheetTitle className="text-white text-base">LIPPO 13</SheetTitle>
                  <SheetDescription className="text-red-100 text-xs">Karang Taruna Pulo Ngandang</SheetDescription>
                </div>
              </div>
              <p className="text-[11px] text-red-100/90 leading-snug">Sistem Transparansi Keuangan HUT RI ke-81</p>
            </SheetHeader>
            <nav className="p-3 space-y-1">
              {MENU.map((m) => {
                const Icon = m.icon;
                const active = pathname === m.href;
                return (
                  <Link key={m.href} href={m.href} onClick={() => setOpen(false)}
                    className={`flex items-start gap-3 p-3 rounded-lg transition ${active ? 'bg-red-600 text-white shadow-md' : 'hover:bg-red-100/60 text-slate-700'}`}>
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${active ? 'text-white' : 'text-red-600'}`} />
                    <div>
                      <p className={`font-semibold text-sm ${active ? 'text-white' : 'text-red-700'}`}>{m.label}</p>
                      <p className={`text-xs ${active ? 'text-red-50' : 'text-muted-foreground'}`}>{m.desc}</p>
                    </div>
                  </Link>
                );
              })}
              <div className="my-2 border-t border-red-100" />
              <Link href="/admin/login" onClick={() => setOpen(false)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-red-100/60 text-slate-700 transition">
                <Lock className="w-5 h-5 mt-0.5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-red-700">Panel Pengurus</p>
                  <p className="text-xs text-muted-foreground">Login admin / bendahara</p>
                </div>
              </Link>
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-red-50 to-transparent">
              <p className="text-[10px] text-center text-muted-foreground">© 2026 LIPPO 13 Pulo Ngandang</p>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2 flex-1 justify-center md:justify-start md:ml-2">
          <div className="w-9 h-9 rounded-lg overflow-hidden ring-2 ring-red-100 shadow-sm">
            <Image src="/assets/logo.jpg" alt="LIPPO 13" width={36} height={36} className="object-cover w-full h-full" />
          </div>
          <div className="hidden xs:block md:block">
            <p className="font-bold text-sm text-red-700 leading-tight">LIPPO 13</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Pulo Ngandang</p>
          </div>
        </Link>

        <Link href="/admin/login">
          <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50 h-9 px-3">
            <Lock className="w-4 h-4 md:mr-1.5" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
