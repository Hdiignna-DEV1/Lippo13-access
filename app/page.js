'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, TrendingUp, Users, Sparkles, Building2, FileText, Heart, PieChart as PieIcon, Wallet, CreditCard, Smartphone, Copy, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };
const fmtMonth = (ym) => { try { const [y, m] = ym.split('-'); return new Date(parseInt(y), parseInt(m)-1, 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }); } catch { return ym; } };

const categoryStyle = {
  warga: 'bg-red-100 text-red-700 border-red-200',
  pemuda: 'bg-green-100 text-green-700 border-green-200',
  sponsor: 'bg-amber-100 text-amber-700 border-amber-200',
  lainnya: 'bg-slate-100 text-slate-700 border-slate-200',
};
const categoryLabel = { warga: 'Warga', pemuda: 'Pemuda', sponsor: 'Sponsor', lainnya: 'Lainnya' };
const CHART_COLORS = { warga: '#dc2626', pemuda: '#16a34a', sponsor: '#f59e0b', lainnya: '#64748b' };

const PAYMENT_STYLES = {
  BCA: { bg: 'from-blue-600 to-blue-800', icon: CreditCard, accent: 'text-blue-100' },
  SeaBank: { bg: 'from-cyan-500 to-cyan-700', icon: CreditCard, accent: 'text-cyan-100' },
  DANA: { bg: 'from-sky-400 to-sky-600', icon: Smartphone, accent: 'text-sky-100' },
};

function PaymentSection({ holder, methods }) {
  const [copied, setCopied] = useState('');
  if (!methods || methods.length === 0) return null;
  const copyNumber = async (num, key) => {
    try { await navigator.clipboard.writeText(num); setCopied(key); setTimeout(() => setCopied(''), 2000); }
    catch (e) { console.error('copy failed', e); }
  };
  return (
    <section className="container mx-auto px-3 md:px-4 pb-6">
      <div className="text-center mb-4">
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 mb-2">
          <Wallet className="w-3 h-3 mr-1" /> Metode Pembayaran
        </Badge>
        <h2 className="text-xl md:text-2xl font-bold text-red-700">Cara Setor Iuran</h2>
        <p className="text-muted-foreground text-xs md:text-sm mt-1 px-2">Transfer ke salah satu rekening, lalu konfirmasi ke bendahara</p>
      </div>
      <div className="max-w-md mx-auto mb-3 p-2.5 rounded-lg bg-gradient-to-r from-red-50 to-green-50 border border-red-100 text-center">
        <p className="text-[10px] text-muted-foreground uppercase">Atas Nama</p>
        <p className="font-bold text-red-700 text-base">{holder || 'Mohamad Rasim'}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {methods.map((m, i) => {
          const style = PAYMENT_STYLES[m.name] || { bg: 'from-slate-500 to-slate-700', icon: CreditCard, accent: 'text-slate-100' };
          const Icon = style.icon;
          const isCopied = copied === `${m.name}-${i}`;
          return (
            <Card key={i} className="border-0 shadow-md overflow-hidden">
              <div className={`bg-gradient-to-br ${style.bg} text-white p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-bold">{m.name}</span>
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/20 text-white border-0 text-[10px] uppercase">{m.type === 'ewallet' ? 'E-Wallet' : 'Bank'}</Badge>
                </div>
                <p className={`${style.accent} text-[10px] mb-0.5`}>Nomor {m.type === 'ewallet' ? 'DANA' : 'Rekening'}</p>
                <p className="font-mono text-lg md:text-xl font-bold tracking-wide select-all">{m.accountNumber}</p>
              </div>
              <CardContent className="p-2">
                <Button onClick={() => copyNumber(m.accountNumber, `${m.name}-${i}`)} variant="outline" className="w-full h-8 text-xs" size="sm">
                  <Copy className="w-3 h-3 mr-1" />{isCopied ? 'Tersalin!' : 'Salin Nomor'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="text-center text-[11px] text-muted-foreground mt-3 px-3">💡 Setelah transfer, mohon konfirmasi ke bendahara agar tercatat di sistem.</p>
    </section>
  );
}

export default function HomePage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [committee, setCommittee] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, t, c] = await Promise.all([
        fetch('/api/public/summary').then(r => r.json()),
        fetch('/api/public/transactions').then(r => r.json()),
        fetch('/api/public/committee').then(r => r.json()),
      ]);
      setSummary(s);
      setTransactions(t.transactions || []);
      setCommittee(c);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const downloadProposal = () => { window.location.href = '/api/public/proposal'; };
  const pieData = summary ? Object.entries(summary.byCategory || {}).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value, label: categoryLabel[name] })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-green-50">
      <NavBar />

      {/* Compact Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative container mx-auto px-3 md:px-4 py-6 md:py-10 text-white text-center">
          <Badge className="bg-green-400 text-green-900 hover:bg-green-400 mb-2 border-0">
            <Heart className="w-3 h-3 mr-1" /> {summary?.eventName || 'HUT RI ke-81'}
          </Badge>
          <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-2">
            Transparansi Iuran
          </h1>
          <p className="text-red-50 text-xs md:text-sm max-w-xl mx-auto mb-4">
            Setiap rupiah tercatat, setiap kontribusi terlihat
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={downloadProposal} disabled={!summary?.hasProposal} size="sm" className="bg-white text-red-700 hover:bg-green-50 font-semibold shadow-lg disabled:opacity-50 h-9">
              <Download className="w-4 h-4 mr-1.5" />
              {summary?.hasProposal ? 'Proposal' : 'Proposal Belum Ada'}
            </Button>
            <Link href="/tentang">
              <Button size="sm" variant="outline" className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 h-9">
                <Info className="w-4 h-4 mr-1.5" /> Tentang Kegiatan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Progress */}
      <section className="container mx-auto px-3 md:px-4 -mt-6 relative z-10">
        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" />
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Total Dana Terkumpul</p>
                <p className="text-2xl md:text-3xl font-bold text-red-700">{loading ? '...' : rupiah(summary?.totalIn)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-base md:text-xl font-semibold text-green-700">{loading ? '...' : rupiah(summary?.target)}</p>
              </div>
            </div>
            <Progress value={summary?.progress || 0} className="h-3 bg-red-50 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-green-600" />
            <div className="flex justify-between items-center mt-1.5 text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-green-700">{(summary?.progress || 0).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-3 md:px-4 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[
            { label: 'Iuran Warga', value: summary?.byCategory?.warga, icon: Users, color: 'red' },
            { label: 'Iuran Pemuda', value: summary?.byCategory?.pemuda, icon: Sparkles, color: 'green' },
            { label: 'Sponsor', value: summary?.byCategory?.sponsor, icon: Building2, color: 'amber' },
            { label: 'Saldo Kas', value: summary?.balance, icon: TrendingUp, color: 'blue' },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardContent className="p-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 bg-${s.color}-100`}>
                  <s.icon className={`w-3.5 h-3.5 text-${s.color}-600`} />
                </div>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm md:text-base font-bold text-foreground">{rupiah(s.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Payment Methods - prominent placement */}
      <PaymentSection holder={committee?.paymentHolder} methods={committee?.paymentMethods || []} />

      {/* Charts */}
      <section className="container mx-auto px-3 md:px-4 pb-6">
        <div className="grid md:grid-cols-2 gap-3">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base text-red-700"><PieIcon className="w-4 h-4" /> Breakdown per Kategori</CardTitle>
            </CardHeader>
            <CardContent className="h-56 md:h-64">
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2}>
                      {pieData.map((d, i) => <Cell key={i} fill={CHART_COLORS[d.name] || '#888'} />)}
                    </Pie>
                    <Tooltip formatter={(v) => rupiah(v)} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base text-red-700"><TrendingUp className="w-4 h-4" /> Tren Pemasukan Bulanan</CardTitle>
            </CardHeader>
            <CardContent className="h-56 md:h-64">
              {(summary?.monthly || []).length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(summary?.monthly || []).map(m => ({ ...m, label: fmtMonth(m.month) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
                    <Tooltip formatter={(v) => rupiah(v)} />
                    <Bar dataKey="total" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Transactions Table */}
      <section className="container mx-auto px-3 md:px-4 pb-10">
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-red-50 to-green-50 py-3">
            <CardTitle className="flex items-center gap-2 text-base text-red-700">
              <FileText className="w-4 h-4" /> Daftar Pemasukan Iuran
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-xs">Tanggal</TableHead>
                    <TableHead className="text-xs">Nama</TableHead>
                    <TableHead className="text-xs">Kategori</TableHead>
                    <TableHead className="text-right text-xs">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
                      <p className="text-sm">Belum ada iuran masuk</p>
                    </TableCell></TableRow>
                  ) : transactions.map((t) => (
                    <TableRow key={t.id} className="hover:bg-red-50/30">
                      <TableCell className="text-xs whitespace-nowrap">{fmtDate(t.date)}</TableCell>
                      <TableCell className="text-sm">
                        <p className="font-medium">{t.name}</p>
                        {t.note && <p className="text-[10px] text-muted-foreground">{t.note}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${categoryStyle[t.category] || categoryStyle.lainnya} text-[10px]`}>
                          {categoryLabel[t.category] || t.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-green-700 whitespace-nowrap">{rupiah(t.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA to About */}
      <section className="container mx-auto px-3 md:px-4 pb-10">
        <Link href="/tentang">
          <Card className="border-0 shadow-md hover:shadow-lg transition cursor-pointer bg-gradient-to-r from-red-600 to-red-700 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-yellow-300" />
                <div>
                  <p className="font-bold text-sm md:text-base">Pelajari Tentang Kegiatan</p>
                  <p className="text-[11px] md:text-xs text-red-100">Tema, tujuan & susunan panitia HUT RI ke-81</p>
                </div>
              </div>
              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 border-0">Selengkapnya →</Badge>
            </CardContent>
          </Card>
        </Link>
      </section>

      <footer><Footer /></footer>
    </div>
  );
}
