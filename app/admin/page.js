'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Plus, Pencil, Trash2, Download, Upload, FileText, Save, ArrowLeft, Wallet, TrendingDown, Settings as SettingsIcon, Search, Receipt, UserPlus, Users as UsersIcon, FileSpreadsheet } from 'lucide-react';
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
const ROLES = [
  { value: 'admin', label: 'Admin (akses penuh)' },
  { value: 'bendahara', label: 'Bendahara' },
  { value: 'pengurus', label: 'Pengurus' },
];

function TxForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || { date: todayISO(), name: '', category: 'warga', amount: '', note: '', type: 'in' });
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Tanggal</Label><Input type="date" value={form.date} onChange={(e) => upd('date', e.target.value)} required /></div>
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
      <div className="space-y-1.5"><Label>Nama / Kelompok</Label><Input value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="contoh: RT 03 Minggu ke-2" required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select value={form.category} onValueChange={(v) => upd('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Jumlah (Rp)</Label><Input type="number" min="0" step="1000" value={form.amount} onChange={(e) => upd('amount', e.target.value)} placeholder="50000" required /></div>
      </div>
      <div className="space-y-1.5"><Label>Keterangan</Label><Textarea rows={2} value={form.note} onChange={(e) => upd('note', e.target.value)} placeholder="opsional" /></div>
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700"><Save className="w-4 h-4 mr-1.5" /> Simpan</Button>
      </DialogFooter>
    </form>
  );
}

function UserForm({ initial, onSubmit, onCancel, isEdit }) {
  const [form, setForm] = useState(initial || { username: '', password: '', fullName: '', role: 'pengurus' });
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div className="space-y-1.5"><Label>Username</Label><Input value={form.username} onChange={(e) => upd('username', e.target.value)} placeholder="bendahara1" disabled={isEdit} required /></div>
      <div className="space-y-1.5"><Label>Nama Lengkap</Label><Input value={form.fullName} onChange={(e) => upd('fullName', e.target.value)} placeholder="Nama Lengkap Pengurus" /></div>
      <div className="space-y-1.5">
        <Label>Role</Label>
        <Select value={form.role} onValueChange={(v) => upd('role', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>{isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}</Label><Input type="password" value={form.password} onChange={(e) => upd('password', e.target.value)} placeholder="********" required={!isEdit} /></div>
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
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [targetInput, setTargetInput] = useState('');
  const [orgInput, setOrgInput] = useState('');
  const [eventInput, setEventInput] = useState('');

  // filters
  const [search, setSearch] = useState('');
  const [fCategory, setFCategory] = useState('all');
  const [fType, setFType] = useState('all');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');

  // users dialogs
  const [openAddUser, setOpenAddUser] = useState(false);
  const [editUser, setEditUser] = useState(null);

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
    setOrgInput(s.organizationName || '');
    setEventInput(s.eventName || '');
    if (me.user?.role === 'admin') {
      const u = await fetch('/api/admin/users').then(r => r.json());
      setUsers(u.users || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

  const addTx = async (form) => {
    const res = await fetch('/api/admin/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { toast.success('Transaksi ditambahkan'); setOpenAdd(false); fetchAll(); }
    else { const d = await res.json(); toast.error(d.error || 'Gagal'); }
  };

  const updateTx = async (form) => {
    const res = await fetch(`/api/admin/transactions/${editTx.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
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
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetAmount: Number(targetInput), organizationName: orgInput, eventName: eventInput }),
    });
    if (res.ok) { toast.success('Pengaturan disimpan'); fetchAll(); }
    else toast.error('Gagal menyimpan');
  };

  const uploadProposal = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Ukuran file maksimal 8MB'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      const res = await fetch('/api/admin/settings/proposal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  const exportCSV = (type) => { window.location.href = type ? `/api/admin/export?type=${type}` : '/api/admin/export'; };
  const exportExcel = (type) => { window.location.href = type ? `/api/admin/export/excel?type=${type}` : '/api/admin/export/excel'; };

  // Receipt PDF generator (client-side jsPDF)
  const generateReceipt = async (tx) => {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(220, 38, 38); // red-600
    doc.rect(0, 0, 210, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BUKTI TRANSAKSI', 105, 16, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(settings?.organizationName || 'LIPPO 13 Pulo Ngandang', 105, 24, { align: 'center' });
    doc.text(settings?.eventName || 'HUT RI ke-80', 105, 30, { align: 'center' });

    // No transaksi
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`No. Transaksi: ${tx.id.slice(0, 8).toUpperCase()}`, 14, 48);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 196, 48, { align: 'right' });

    // Detail table
    autoTable(doc, {
      startY: 56,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 3 },
      body: [
        ['Tanggal Transaksi', ':', fmtDate(tx.date)],
        ['Nama / Kelompok', ':', tx.name],
        ['Kategori', ':', (CATEGORIES.find(c => c.value === tx.category)?.label) || tx.category],
        ['Jenis', ':', tx.type === 'in' ? 'PEMASUKAN' : 'PENGELUARAN'],
        ['Jumlah', ':', rupiah(tx.amount)],
        ['Keterangan', ':', tx.note || '-'],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 6 } },
    });

    // Highlighted amount box
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(tx.type === 'in' ? 22 : 220, tx.type === 'in' ? 163 : 38, tx.type === 'in' ? 74 : 38);
    doc.rect(14, finalY, 182, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${tx.type === 'in' ? '+' : '-'} ${rupiah(tx.amount)}`, 105, finalY + 12, { align: 'center' });

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Bukti ini sah dan tercatat dalam sistem keuangan LIPPO 13 Pulo Ngandang.', 105, finalY + 30, { align: 'center' });
    doc.text(`Dicatat oleh: ${tx.createdBy || 'admin'}  •  ${new Date(tx.createdAt).toLocaleString('id-ID')}`, 105, finalY + 36, { align: 'center' });

    doc.save(`bukti-${tx.id.slice(0, 8)}-${tx.date}.pdf`);
    toast.success('Bukti transaksi diunduh');
  };

  // user management
  const addUser = async (form) => {
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { toast.success('Pengguna ditambahkan'); setOpenAddUser(false); fetchAll(); }
    else { const d = await res.json(); toast.error(d.error || 'Gagal'); }
  };
  const updateUser = async (form) => {
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    delete payload.username;
    const res = await fetch(`/api/admin/users/${editUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { toast.success('Pengguna diupdate'); setEditUser(null); fetchAll(); }
    else { const d = await res.json(); toast.error(d.error || 'Gagal'); }
  };
  const deleteUser = async (id) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Pengguna dihapus'); fetchAll(); }
    else { const d = await res.json(); toast.error(d.error || 'Gagal'); }
  };

  // Filtered tx
  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      if (search && !(`${t.name} ${t.note || ''}`.toLowerCase().includes(search.toLowerCase()))) return false;
      if (fCategory !== 'all' && t.category !== fCategory) return false;
      if (fType !== 'all' && t.type !== fType) return false;
      if (fFrom && t.date < fFrom) return false;
      if (fTo && t.date > fTo) return false;
      return true;
    });
  }, [transactions, search, fCategory, fType, fFrom, fTo]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Memuat...</p></div>;

  const totalIn = filteredTx.filter(t => t.type === 'in').reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = filteredTx.filter(t => t.type === 'out').reduce((s, t) => s + Number(t.amount), 0);
  const allTotalIn = transactions.filter(t => t.type === 'in').reduce((s, t) => s + Number(t.amount), 0);
  const allTotalOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + Number(t.amount), 0);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="w-9 h-9 rounded-lg overflow-hidden ring-2 ring-red-100">
              <Image src="/assets/logo.jpg" alt="LIPPO 13" width={36} height={36} className="object-cover w-full h-full" />
            </div>
            <div>
              <p className="font-bold text-red-700 text-sm md:text-base">Panel Pengurus</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">{user?.fullName || user?.username}</span>
                <Badge variant="outline" className="ml-2 text-[10px] py-0">{user?.role}</Badge>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-1.5" /> Keluar</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">Total Pemasukan</p><p className="text-xl font-bold text-green-700">{rupiah(allTotalIn)}</p></div>
              <Wallet className="w-8 h-8 text-green-500/40" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">Total Pengeluaran</p><p className="text-xl font-bold text-red-700">{rupiah(allTotalOut)}</p></div>
              <TrendingDown className="w-8 h-8 text-red-500/40" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">Saldo Kas</p><p className="text-xl font-bold text-blue-700">{rupiah(allTotalIn - allTotalOut)}</p></div>
              <Wallet className="w-8 h-8 text-blue-500/40" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tx" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} max-w-xl`}>
            <TabsTrigger value="tx">Transaksi</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">Pengguna</TabsTrigger>}
          </TabsList>

          {/* TRANSACTIONS */}
          <TabsContent value="tx">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Manajemen Transaksi</CardTitle>
                  <CardDescription>Pemasukan iuran & pengeluaran kas panitia</CardDescription>
                </div>
                <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                  <DialogTrigger asChild><Button className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-1.5" /> Tambah</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Tambah Transaksi</DialogTitle></DialogHeader>
                    <TxForm onSubmit={addTx} onCancel={() => setOpenAdd(false)} />
                  </DialogContent>
                </Dialog>
              </CardHeader>

              {/* Filters */}
              <CardContent className="border-y bg-slate-50/50 py-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <div className="md:col-span-2 relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input placeholder="Cari nama / keterangan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
                  </div>
                  <Select value={fCategory} onValueChange={setFCategory}>
                    <SelectTrigger><SelectValue placeholder="Kategori" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={fType} onValueChange={setFType}>
                    <SelectTrigger><SelectValue placeholder="Jenis" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      <SelectItem value="in">Pemasukan</SelectItem>
                      <SelectItem value="out">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-1">
                    <Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="text-xs" />
                    <Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="text-xs" />
                  </div>
                </div>
                {(search || fCategory !== 'all' || fType !== 'all' || fFrom || fTo) && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Menampilkan {filteredTx.length} dari {transactions.length} transaksi • Pemasukan terfilter: <span className="font-semibold text-green-700">{rupiah(totalIn)}</span> • Pengeluaran: <span className="font-semibold text-red-700">{rupiah(totalOut)}</span></span>
                    <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setFCategory('all'); setFType('all'); setFFrom(''); setFTo(''); }}>Reset</Button>
                  </div>
                )}
              </CardContent>

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
                      {filteredTx.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada transaksi yang cocok</TableCell></TableRow>
                      ) : filteredTx.map((t) => (
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
                              <Button size="icon" variant="ghost" onClick={() => generateReceipt(t)} title="Cetak Bukti PDF"><Receipt className="w-4 h-4 text-blue-600" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditTx(t)} title="Edit"><Pencil className="w-4 h-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></Button>
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
                  <CardTitle className="flex items-center gap-2"><SettingsIcon className="w-5 h-5" /> Pengaturan Organisasi</CardTitle>
                  <CardDescription>Profil yang ditampilkan di halaman publik</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5"><Label>Nama Organisasi</Label><Input value={orgInput} onChange={(e) => setOrgInput(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Nama Kegiatan</Label><Input value={eventInput} onChange={(e) => setEventInput(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Target Dana (Rp)</Label><Input type="number" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} /></div>
                  <p className="text-xs text-muted-foreground">Target saat ini: {rupiah(settings?.targetAmount)}</p>
                  <Button onClick={saveSettings} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-1.5" /> Simpan</Button>
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
                        <span className="font-medium truncate">{settings.proposalFileName}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={removeProposal} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ) : (<p className="text-sm text-muted-foreground">Belum ada file proposal</p>)}
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
                <CardDescription>Download data dalam format CSV atau Excel (.xlsx)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1"><FileSpreadsheet className="w-4 h-4 text-green-700" /> Excel (.xlsx) — rekomendasi</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <Button onClick={() => exportExcel(null)} className="bg-green-700 hover:bg-green-800"><Download className="w-4 h-4 mr-1.5" /> Semua</Button>
                    <Button onClick={() => exportExcel('in')} variant="outline" className="border-green-300 text-green-700"><Download className="w-4 h-4 mr-1.5" /> Pemasukan</Button>
                    <Button onClick={() => exportExcel('out')} variant="outline" className="border-green-300 text-green-700"><Download className="w-4 h-4 mr-1.5" /> Pengeluaran</Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1"><FileText className="w-4 h-4 text-red-700" /> CSV (.csv)</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <Button onClick={() => exportCSV(null)} className="bg-red-600 hover:bg-red-700"><Download className="w-4 h-4 mr-1.5" /> Semua</Button>
                    <Button onClick={() => exportCSV('in')} variant="outline"><Download className="w-4 h-4 mr-1.5" /> Pemasukan</Button>
                    <Button onClick={() => exportCSV('out')} variant="outline"><Download className="w-4 h-4 mr-1.5" /> Pengeluaran</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS (admin only) */}
          {isAdmin && (
            <TabsContent value="users">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><UsersIcon className="w-5 h-5" /> Manajemen Pengguna</CardTitle>
                    <CardDescription>Tambah pengurus / bendahara untuk akses panel</CardDescription>
                  </div>
                  <Dialog open={openAddUser} onOpenChange={setOpenAddUser}>
                    <DialogTrigger asChild><Button className="bg-red-600 hover:bg-red-700"><UserPlus className="w-4 h-4 mr-1.5" /> Tambah</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Tambah Pengguna</DialogTitle>
                        <DialogDescription>Buat akun baru untuk pengurus organisasi</DialogDescription>
                      </DialogHeader>
                      <UserForm onSubmit={addUser} onCancel={() => setOpenAddUser(false)} />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Nama Lengkap</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.username}{u.id === user.uid && <Badge variant="outline" className="ml-2 text-[10px]">Anda</Badge>}</TableCell>
                          <TableCell>{u.fullName}</TableCell>
                          <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDate(u.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setEditUser(u)}><Pencil className="w-4 h-4" /></Button>
                              {u.username !== user.username && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus pengguna {u.username}?</AlertDialogTitle>
                                      <AlertDialogDescription>Aksi ini tidak dapat dibatalkan.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Edit Pengguna</DialogTitle></DialogHeader>
                  {editUser && <UserForm initial={{ ...editUser, password: '' }} isEdit onSubmit={updateUser} onCancel={() => setEditUser(null)} />}
                </DialogContent>
              </Dialog>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
