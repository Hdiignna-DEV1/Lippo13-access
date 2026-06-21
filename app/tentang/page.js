'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Target, Star, Crown, Shield, Wallet, ArrowLeft, Sparkles } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const DIVISION_LABELS = {
  pelindung: 'Pelindung', penasihat: 'Penasihat',
  ketua: 'Ketua Pelaksana', 'wakil-ketua': 'Wakil Ketua', sekretaris: 'Sekretaris', bendahara: 'Bendahara',
  acara: 'Seksi Acara', perlengkapan: 'Seksi Perlengkapan', konsumsi: 'Seksi Konsumsi',
  dokumentasi: 'Seksi Dokumentasi & Publikasi', humas: 'Seksi Humas & Dana Usaha', keamanan: 'Seksi Keamanan & Kebersihan',
};
const DIVISION_COLORS = {
  pelindung: { bg: 'from-amber-500 to-amber-600', text: 'text-amber-700', ring: 'ring-amber-200', light: 'bg-amber-50' },
  penasihat: { bg: 'from-amber-500 to-amber-600', text: 'text-amber-700', ring: 'ring-amber-200', light: 'bg-amber-50' },
  ketua: { bg: 'from-red-600 to-red-700', text: 'text-red-700', ring: 'ring-red-200', light: 'bg-red-50' },
  'wakil-ketua': { bg: 'from-red-500 to-red-600', text: 'text-red-700', ring: 'ring-red-200', light: 'bg-red-50' },
  sekretaris: { bg: 'from-rose-500 to-rose-600', text: 'text-rose-700', ring: 'ring-rose-200', light: 'bg-rose-50' },
  bendahara: { bg: 'from-rose-500 to-rose-600', text: 'text-rose-700', ring: 'ring-rose-200', light: 'bg-rose-50' },
  acara: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-700', ring: 'ring-blue-200', light: 'bg-blue-50' },
  perlengkapan: { bg: 'from-orange-500 to-orange-600', text: 'text-orange-700', ring: 'ring-orange-200', light: 'bg-orange-50' },
  konsumsi: { bg: 'from-yellow-500 to-yellow-600', text: 'text-yellow-700', ring: 'ring-yellow-200', light: 'bg-yellow-50' },
  dokumentasi: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-700', ring: 'ring-purple-200', light: 'bg-purple-50' },
  humas: { bg: 'from-green-500 to-green-600', text: 'text-green-700', ring: 'ring-green-200', light: 'bg-green-50' },
  keamanan: { bg: 'from-slate-500 to-slate-600', text: 'text-slate-700', ring: 'ring-slate-200', light: 'bg-slate-50' },
};
const getInitials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();

function PersonCard({ member, size = 'md' }) {
  const c = DIVISION_COLORS[member.division] || DIVISION_COLORS.acara;
  const sizes = {
    sm: { avatar: 'w-9 h-9 text-xs', name: 'text-sm', pos: 'text-[10px]' },
    md: { avatar: 'w-12 h-12 text-sm', name: 'text-sm', pos: 'text-[10px]' },
    lg: { avatar: 'w-14 h-14 text-base', name: 'text-base', pos: 'text-xs' },
  }[size];
  return (
    <div className={`flex items-center gap-2.5 p-2.5 rounded-lg ${c.light} ring-1 ${c.ring}`}>
      <div className={`${sizes.avatar} rounded-full bg-gradient-to-br ${c.bg} text-white flex items-center justify-center font-bold shadow-md flex-shrink-0`}>
        {getInitials(member.fullName)}
      </div>
      <div className="min-w-0">
        <p className={`${sizes.name} font-semibold truncate ${c.text}`}>{member.fullName}</p>
        {size !== 'sm' && <p className={`${sizes.pos} text-muted-foreground capitalize`}>{member.role === 'koordinator' ? 'Koordinator' : 'Anggota'}</p>}
      </div>
    </div>
  );
}

export default function TentangPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/committee').then(r => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  const members = data?.members || [];
  const byDiv = (d) => members.filter(m => m.division === d).sort((a, b) => a.order - b.order);
  const single = (d) => byDiv(d)[0];
  const SEKSI = ['acara', 'perlengkapan', 'konsumsi', 'dokumentasi', 'humas', 'keamanan'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-green-50">
      <NavBar />

      {/* Hero with Logo */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative container mx-auto px-3 md:px-4 py-8 md:py-12 text-white">
          <Link href="/" className="inline-flex items-center text-red-100 hover:text-white text-xs mb-3">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Beranda
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-2xl flex-shrink-0">
              <Image src="/assets/logo.jpg" alt="LIPPO 13" width={112} height={112} className="object-cover w-full h-full" />
            </div>
            <div>
              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 mb-2 border-0">
                <Sparkles className="w-3 h-3 mr-1" /> Tentang Kami
              </Badge>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight">LIPPO 13</h1>
              <p className="text-red-100 text-sm md:text-base">Karang Taruna Kp. Pulo Ngandang</p>
              <p className="text-red-200/90 text-xs mt-1">Lingkungan Poncol, Sindangsari, Cabangbungin, Bekasi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tema */}
      <section className="container mx-auto px-3 md:px-4 -mt-6 relative z-10 pb-6">
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-red-600 to-red-800 text-white p-5 md:p-7">
            <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 mb-3 border-0">
              <Star className="w-3 h-3 mr-1" /> Tema Kegiatan
            </Badge>
            <div className="space-y-2 mb-4">
              {(data?.theme || '').split('\n').filter(Boolean).map((line, i) => (
                <h2 key={i} className="text-lg md:text-2xl font-bold leading-snug">&quot;{line}&quot;</h2>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur rounded-lg p-2.5">
                <Calendar className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-red-100">Tanggal</p>
                  <p className="font-semibold text-sm truncate">{data?.eventDate || '16-17 Agustus 2026'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur rounded-lg p-2.5">
                <MapPin className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-red-100">Lokasi</p>
                  <p className="font-semibold text-xs truncate">{data?.eventLocation || 'Lapangan Sindangsari'}</p>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-red-700" />
              <h3 className="text-base font-bold text-red-700">Tujuan Kegiatan</h3>
            </div>
            <div className="space-y-2">
              {(data?.visiMisi || []).map((v, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-gradient-to-r from-red-50 to-green-50 rounded-lg border border-red-100">
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <p className="text-sm text-slate-700">{v}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Susunan Kepanitiaan */}
      <section className="container mx-auto px-3 md:px-4 pb-8">
        <div className="text-center mb-5">
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 mb-2">
            <Crown className="w-3 h-3 mr-1" /> Susunan Kepanitiaan
          </Badge>
          <h2 className="text-xl md:text-3xl font-bold text-red-700">Tim Pelaksana</h2>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Pengurus dan panitia HUT RI ke-81</p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Memuat...</div>
        ) : (
          <>
            {/* Pelindung & Penasihat */}
            <div className="grid sm:grid-cols-2 gap-2.5 mb-3 max-w-2xl mx-auto">
              {['pelindung', 'penasihat'].map((d) => {
                const m = single(d);
                if (!m) return null;
                const c = DIVISION_COLORS[d];
                return (
                  <Card key={d} className="border-0 shadow-md overflow-hidden">
                    <div className={`bg-gradient-to-r ${c.bg} text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1`}>
                      <Shield className="w-3 h-3" /> {DIVISION_LABELS[d]}
                    </div>
                    <CardContent className="p-3"><PersonCard member={m} size="md" /></CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Ketua & Wakil */}
            <div className="grid sm:grid-cols-2 gap-2.5 mb-3 max-w-2xl mx-auto">
              {['ketua', 'wakil-ketua'].map((d) => {
                const m = single(d);
                if (!m) return null;
                const c = DIVISION_COLORS[d];
                return (
                  <Card key={d} className="border-0 shadow-md overflow-hidden">
                    <div className={`bg-gradient-to-r ${c.bg} text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1`}>
                      <Crown className="w-3 h-3" /> {DIVISION_LABELS[d]}
                    </div>
                    <CardContent className="p-3"><PersonCard member={m} size="md" /></CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Sekretaris & Bendahara */}
            <div className="grid sm:grid-cols-2 gap-2.5 mb-5 max-w-2xl mx-auto">
              {['sekretaris', 'bendahara'].map((d) => {
                const m = single(d);
                if (!m) return null;
                const c = DIVISION_COLORS[d];
                return (
                  <Card key={d} className="border-0 shadow-md overflow-hidden">
                    <div className={`bg-gradient-to-r ${c.bg} text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide`}>
                      {DIVISION_LABELS[d]}
                    </div>
                    <CardContent className="p-3"><PersonCard member={m} size="md" /></CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 6 Seksi */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SEKSI.map((d) => {
                const list = byDiv(d);
                if (list.length === 0) return null;
                const koor = list.find(m => m.role === 'koordinator');
                const anggota = list.filter(m => m.role !== 'koordinator');
                const c = DIVISION_COLORS[d];
                return (
                  <Card key={d} className="border-0 shadow-md overflow-hidden flex flex-col">
                    <div className={`bg-gradient-to-r ${c.bg} text-white px-3 py-2 text-xs font-bold`}>
                      {DIVISION_LABELS[d]}
                    </div>
                    <CardContent className="p-2.5 space-y-2 flex-1">
                      {koor && (
                        <div>
                          <p className="text-[9px] uppercase text-muted-foreground font-semibold mb-1 px-1">Koordinator</p>
                          <PersonCard member={koor} size="sm" />
                        </div>
                      )}
                      {anggota.length > 0 && (
                        <div>
                          <p className="text-[9px] uppercase text-muted-foreground font-semibold mb-1 px-1">Anggota</p>
                          <div className="space-y-1.5">
                            {anggota.map((m) => <PersonCard key={m.id} member={m} size="sm" />)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* CTA back to home */}
      <section className="container mx-auto px-3 md:px-4 pb-8">
        <Link href="/">
          <Card className="border-0 shadow-md hover:shadow-lg transition cursor-pointer bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-yellow-300" />
                <div>
                  <p className="font-bold text-sm md:text-base">Cek Rekap Iuran</p>
                  <p className="text-[11px] md:text-xs text-green-100">Pantau dana terkumpul & cara setor iuran</p>
                </div>
              </div>
              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 border-0">Buka →</Badge>
            </CardContent>
          </Card>
        </Link>
      </section>

      <Footer />
    </div>
  );
}
