'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, TrendingUp, Users, Sparkles, Building2, Lock, FileText, Heart } from 'lucide-react';
import Link from 'next/link';

const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};

const categoryStyle = {
  warga: 'bg-red-100 text-red-700 border-red-200',
  pemuda: 'bg-green-100 text-green-700 border-green-200',
  sponsor: 'bg-amber-100 text-amber-700 border-amber-200',
  lainnya: 'bg-slate-100 text-slate-700 border-slate-200',
};
const categoryLabel = { warga: 'Warga', pemuda: 'Pemuda', sponsor: 'Sponsor', lainnya: 'Lainnya' };

export default function HomePage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, t] = await Promise.all([
        fetch('/api/public/summary').then(r => r.json()),
        fetch('/api/public/transactions').then(r => r.json()),
      ]);
      setSummary(s);
      setTransactions(t.transactions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const downloadProposal = () => {
    window.location.href = '/api/public/proposal';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-red-100">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm md:text-base text-red-700 leading-tight">Karang Taruna</p>
              <p className="text-xs text-muted-foreground leading-tight">Kp. Pulo Ngandang</p>
            </div>
          </div>
          <Link href="/admin/login">
            <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
              <Lock className="w-4 h-4 mr-1.5" /> Admin
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-800" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative container mx-auto px-4 py-12 md:py-16 text-white">
          <Badge className="bg-green-400 text-green-900 hover:bg-green-400 mb-4 border-0">
            <Heart className="w-3 h-3 mr-1" /> {summary?.eventName || 'HUT RI ke-80'}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-3">
            Transparansi Iuran<br />
            <span className="text-green-300">Bersama Warga & Pemuda</span>
          </h1>
          <p className="text-red-50 text-base md:text-lg max-w-2xl mb-6">
            Pantau perkembangan dana persiapan kegiatan HUT RI secara terbuka. Setiap rupiah tercatat, setiap kontribusi terlihat.
          </p>
          <Button onClick={downloadProposal} disabled={!summary?.hasProposal} className="bg-white text-red-700 hover:bg-green-50 font-semibold shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            {summary?.hasProposal ? 'Download Proposal Sponsor' : 'Proposal Belum Tersedia'}
          </Button>
        </div>
      </section>

      {/* Progress Card */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" />
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Dana Terkumpul</p>
                <p className="text-3xl md:text-4xl font-bold text-red-700">{loading ? '...' : rupiah(summary?.totalIn)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Target</p>
                <p className="text-xl md:text-2xl font-semibold text-green-700">{loading ? '...' : rupiah(summary?.target)}</p>
              </div>
            </div>
            <Progress value={summary?.progress || 0} className="h-4 bg-red-50 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-green-600" />
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-green-700">{(summary?.progress || 0).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Iuran Warga', value: summary?.byCategory?.warga, icon: Users, color: 'red' },
            { label: 'Iuran Pemuda', value: summary?.byCategory?.pemuda, icon: Sparkles, color: 'green' },
            { label: 'Sponsor', value: summary?.byCategory?.sponsor, icon: Building2, color: 'amber' },
            { label: 'Saldo Kas', value: summary?.balance, icon: TrendingUp, color: 'blue' },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 bg-${s.color}-100`}>
                  <s.icon className={`w-4 h-4 text-${s.color}-600`} />
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-base md:text-lg font-bold text-foreground">{rupiah(s.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Transactions table */}
      <section className="container mx-auto px-4 pb-12">
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-red-50 to-green-50">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <FileText className="w-5 h-5" />
              Daftar Pemasukan Iuran
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama / Kelompok</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="hidden md:table-cell">Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell></TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Belum ada data iuran masuk.
                    </TableCell></TableRow>
                  ) : transactions.map((t) => (
                    <TableRow key={t.id} className="hover:bg-red-50/30">
                      <TableCell className="font-medium whitespace-nowrap">{fmtDate(t.date)}</TableCell>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={categoryStyle[t.category] || categoryStyle.lainnya}>
                          {categoryLabel[t.category] || t.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-700">{rupiah(t.amount)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t bg-red-900 text-red-100 py-6">
        <div className="container mx-auto px-4 text-center text-sm">
          <p className="font-semibold mb-1">Karang Taruna Kp. Pulo Ngandang</p>
          <p className="text-red-200/80 text-xs">Sistem Transparansi Keuangan • Dirgahayu Republik Indonesia</p>
        </div>
      </footer>
    </div>
  );
}
