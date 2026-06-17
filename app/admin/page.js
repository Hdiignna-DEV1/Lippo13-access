'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Plus, Pencil, Trash2, Download, Upload, FileText, Save, ArrowLeft, Wallet, TrendingDown, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };

const CATEGORIES = [
  { value: 'warga', label: 'Iuran Warga (RT/Mingguan)' },
  { value: 'pemuda', label: 'Iuran Pemuda Mandiri' },
  { value: 'sponsor', label: 'Sponsor / Donasi' },
  { value: 'lainnya', label: 'Lainnya' },
];

function TxForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || {
    date: todayISO(), name: '', category: 'warga', amount: '', note: '', type: 'in',
  });
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tanggal</Label>
          <Input type="date" value={form.date} onChange={(e) => upd('date', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Jenis</Label>
          <Select value={form.type} onValueChange={(v) => upd('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in">Pemasukan</SelectItem>
              <SelectItem value="out">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Nama / Kelompok</Label>
        <Input value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="contoh: RT 03 Minggu ke-2" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select value={form.category} onValueChange={(v) => upd('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Jumlah (Rp)</Label>
          <Input type="number" min="0" step="1000" value={form.amount} onChange={(e) => upd('amount', e.target.value)} placeholder="50000" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Keterangan</Label>
        <Textarea rows={2} value={form.note} onChange={(e) => upd('note', e.target.value)} placeholder="opsional" />
      </div>
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700"><Save className="w-4 h-4 mr-1.5" /> Simpan</Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [targetInput, setTargetInput] = useState('');

  const fetchAll = async () => {
    const me = await fetch('/api/auth/me').then(r => r.json());
    if (!me.authenticated) { router.push('/admin/login'); return; }
    setUser(me.user);
    const [t, s] = await Promise.all([
      fetch('/api/admin/transactions').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
    ]);
    setTransactions(t.transactions || []);
    setSettings(s);
    setTargetInput(String(s.targetAmount || ''));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const addTx = async (form) => {
    const res = await fetch('/api/admin/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success('Transaksi ditambahkan'); setOpenAdd(false); fetchAll(); }
    else { const d = await res.json(); toast.error(d.error || 'Gagal'); }
  };

  const updateTx = async (form) => {
    const res = await fetch(`/api/admin/transactions/${editTx.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success('Transaksi diupdate'); setEditTx(null); fetchAll(); }
    else { const d = await res.json(); toast.error(d.error || 'Gagal'); }
  };

  const deleteTx = async (id) => {
    const res = await fetch(`/api/admin/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Transaksi dihapus'); fetchAll(); }
    else toast.error('Gagal menghapus');
  };

  const saveSettings = async () => {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetAmount: Number(targetInput) }),
    });
    if (res.ok) { toast.success('Target dana disimpan'); fetchAll(); }
    else toast.error('Gagal menyimpan');
  };

  const uploadProposal = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Ukuran file maksimal 8MB'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      const res = await fetch('/api/admin/settings/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, fileName: file.name, mimeType: file.type }),
      });
      if (res.ok) { toast.success('Proposal terupload'); fetchAll(); }
      else toast.error('Upload gagal');
    };
    reader.readAsDataURL(file);
  };

  const removeProposal = async () => {
    const res = await fetch('/api/admin/settings/proposal', { method: 'DELETE' });
    if (res.ok) { toast.success('Proposal dihapus'); fetchAll(); }
  };

  const exportCSV = (type) => {
    const url = type ? `/api/admin/export?type=${type}` : '/api/admin/export';
    window.location.href = url;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Memuat...</p></div>;

  const totalIn = transactions.filter(t => t.type === 'in').reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <p className="font-bold text-red-700 text-sm md:text-base">Panel Pengurus</p>
              <p className="text-xs text-muted-foreground">Login sebagai <span className="font-medium">{user?.username}</span></p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-1.5" /> Keluar</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Pemasukan</p>
                <p className="text-xl font-bold text-green-700">{rupiah(totalIn)}</p>
              </div>
              <Wallet className="w-8 h-8 text-green-500/40" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Pengeluaran</p>
                <p className="text-xl font-bold text-red-700">{rupiah(totalOut)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500/40" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Saldo Kas</p>
                <p className="text-xl font-bold text-blue-700">{rupiah(totalIn - totalOut)}</p>
              </div>
              <Wallet className="w-8 h-8 text-blue-500/40" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tx" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="tx">Transaksi</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* TRANSACTIONS */}
          <TabsContent value="tx">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Manajemen Transaksi</CardTitle>
                  <CardDescription>Pemasukan iuran & pengeluaran kas panitia</CardDescription>
                </div>
                <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-1.5" /> Tambah</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Tambah Transaksi</DialogTitle></DialogHeader>
                    <TxForm onSubmit={addTx} onCancel={() => setOpenAdd(false)} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada transaksi</TableCell></TableRow>
                      ) : transactions.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="whitespace-nowrap text-sm">{fmtDate(t.date)}</TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{t.name}</p>
                            {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{t.category}</Badge></TableCell>
                          <TableCell>
                            {t.type === 'in'
                              ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Masuk</Badge>
                              : <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Keluar</Badge>}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${t.type === 'in' ? 'text-green-700' : 'text-red-700'}`}>
                            {t.type === 'in' ? '+' : '-'} {rupiah(t.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setEditTx(t)}><Pencil className="w-4 h-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus transaksi?</AlertDialogTitle>
                                    <AlertDialogDescription>Aksi ini tidak dapat dibatalkan.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteTx(t.id)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Edit dialog */}
            <Dialog open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Transaksi</DialogTitle></DialogHeader>
                {editTx && <TxForm initial={editTx} onSubmit={updateTx} onCancel={() => setEditTx(null)} />}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><SettingsIcon className="w-5 h-5" /> Target Dana</CardTitle>
                  <CardDescription>Target dana persiapan HUT RI yang ditampilkan di halaman publik</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label>Jumlah Target (Rp)</Label>
                  <Input type="number" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Saat ini: {rupiah(settings?.targetAmount)}</p>
                  <Button onClick={saveSettings} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-1.5" /> Simpan Target</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Proposal Sponsor</CardTitle>
                  <CardDescription>Upload PDF proposal yang bisa di-download warga</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {settings?.hasProposal ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-green-700" />
                        <span className="font-medium">{settings.proposalFileName}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={removeProposal} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada file proposal</p>
                  )}
                  <Label htmlFor="file" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition">
                      <Upload className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
                      <p className="text-sm font-medium">Klik untuk upload PDF</p>
                      <p className="text-xs text-muted-foreground">Maksimal 8 MB</p>
                    </div>
                  </Label>
                  <input id="file" type="file" accept="application/pdf" className="hidden" onChange={(e) => uploadProposal(e.target.files?.[0])} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EXPORT */}
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Export Rekap Laporan</CardTitle>
                <CardDescription>Download data dalam format CSV (kompatibel Excel)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <Button onClick={() => exportCSV(null)} className="bg-red-600 hover:bg-red-700"><Download className="w-4 h-4 mr-1.5" /> Semua Transaksi</Button>
                  <Button onClick={() => exportCSV('in')} className="bg-green-600 hover:bg-green-700"><Download className="w-4 h-4 mr-1.5" /> Hanya Pemasukan</Button>
                  <Button onClick={() => exportCSV('out')} variant="outline"><Download className="w-4 h-4 mr-1.5" /> Hanya Pengeluaran</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
