'use client';

import Link from 'next/link';
import { Mail, Instagram, Phone, HelpCircle, Code, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-red-900 to-red-950 text-red-100 mt-4">
      <div className="container mx-auto px-3 md:px-4 py-7">
        <div className="grid md:grid-cols-3 gap-6 mb-5">
          {/* Org info */}
          <div>
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-yellow-300" /> LIPPO 13
            </h3>
            <p className="text-xs text-red-200/90 mb-3 leading-relaxed">
              Karang Taruna Kp. Pulo Ngandang.<br/>
              Sistem Transparansi Keuangan HUT RI ke-81.
            </p>
            <div className="space-y-1.5">
              <a href="mailto:lippopulongandang@gmail.com" className="flex items-center gap-2 text-xs text-red-100 hover:text-yellow-300 transition">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">lippopulongandang@gmail.com</span>
              </a>
              <a href="https://instagram.com/official_lippo13" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-red-100 hover:text-yellow-300 transition">
                <Instagram className="w-3.5 h-3.5 flex-shrink-0" />
                <span>@official_lippo13</span>
              </a>
            </div>
          </div>

          {/* Tech Support */}
          <div>
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-yellow-300" /> Bantuan Teknis
            </h3>
            <p className="text-xs text-red-200/90 mb-3 leading-relaxed">
              Ada masalah dengan website ini?<br/>Hubungi developer:
            </p>
            <div className="space-y-1.5">
              <a href="https://wa.me/6285173193389" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-red-100 hover:text-green-300 transition">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>WhatsApp: 0851-7319-3389</span>
              </a>
              <a href="mailto:hadigunadeden@gmail.com" className="flex items-center gap-2 text-xs text-red-100 hover:text-yellow-300 transition">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">hadigunadeden@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-bold text-sm mb-2">Tautan Cepat</h3>
            <div className="space-y-1.5 text-xs">
              <Link href="/" className="block text-red-100 hover:text-yellow-300 transition">→ Beranda &amp; Rekap Iuran</Link>
              <Link href="/tentang" className="block text-red-100 hover:text-yellow-300 transition">→ Tentang Kegiatan</Link>
              <Link href="/admin/login" className="block text-red-100 hover:text-yellow-300 transition">→ Panel Pengurus</Link>
            </div>
          </div>
        </div>

        {/* Credit bar */}
        <div className="border-t border-red-800/70 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-red-200/80">
          <p>© 2026 LIPPO 13 Pulo Ngandang • Dirgahayu Republik Indonesia ke-81</p>
          <p className="flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-yellow-300" />
            Dibuat oleh <span className="font-bold text-yellow-300 tracking-wide">Hdiignna-DEV</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
