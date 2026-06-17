import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { createSession, verifyToken, SESSION_COOKIE } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ORG_NAME = process.env.ORG_NAME || 'LIPPO 13 Pulo Ngandang';

async function ensureAdmin() {
  const db = await getDb();
  const users = db.collection('users');
  const existing = await users.findOne({ username: ADMIN_USERNAME });
  if (!existing) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await users.insertOne({
      id: uuidv4(),
      username: ADMIN_USERNAME,
      passwordHash: hash,
      role: 'admin',
      fullName: 'Administrator',
      createdAt: new Date().toISOString(),
    });
  }
}

async function ensureSettings() {
  const db = await getDb();
  const settings = db.collection('settings');
  const existing = await settings.findOne({ key: 'global' });
  if (!existing) {
    await settings.insertOne({
      key: 'global',
      targetAmount: 6000000,
      organizationName: ORG_NAME,
      eventName: 'HUT RI ke-81',
      theme: 'Semarak 81 Tahun Merdeka: Bangkit Bersama, Bergerak Nyata, Berdampak Raya.\nMerajut Asa Kemerdekaan: Warga Rukun, Indonesia Tangguh.',
      eventDate: '16-17 Agustus 2026',
      eventLocation: 'Lapangan depan Rumah Asep, Sindangsari, Cabangbungin, Bekasi',
      visiMisi: [
        'Menumbuhkan kembali semangat gotong royong dan kepedulian sosial di tengah lingkungan.',
        'Melestarikan budaya dan tradisi khas 17 Agustus sebagai bentuk rasa syukur atas kemerdekaan Republik Indonesia.',
        'Menciptakan ruang interaksi yang harmonis, inklusif, dan menyenangkan bagi seluruh lapisan usia.',
      ],
      proposalFile: null,
      proposalFileName: null,
      proposalMimeType: null,
      updatedAt: new Date().toISOString(),
    });
  } else {
    // Backward-compat: add missing fields
    const patch = {};
    if (existing.theme === undefined) patch.theme = 'Semarak 81 Tahun Merdeka: Bangkit Bersama, Bergerak Nyata, Berdampak Raya.\nMerajut Asa Kemerdekaan: Warga Rukun, Indonesia Tangguh.';
    if (existing.eventDate === undefined) patch.eventDate = '16-17 Agustus 2026';
    if (existing.eventLocation === undefined) patch.eventLocation = 'Lapangan depan Rumah Asep, Sindangsari, Cabangbungin, Bekasi';
    if (existing.visiMisi === undefined) patch.visiMisi = [
      'Menumbuhkan kembali semangat gotong royong dan kepedulian sosial di tengah lingkungan.',
      'Melestarikan budaya dan tradisi khas 17 Agustus sebagai bentuk rasa syukur atas kemerdekaan Republik Indonesia.',
      'Menciptakan ruang interaksi yang harmonis, inklusif, dan menyenangkan bagi seluruh lapisan usia.',
    ];
    if (Object.keys(patch).length) await settings.updateOne({ key: 'global' }, { $set: patch });
  }
}

const INITIAL_COMMITTEE = [
  { fullName: 'Ust. Sakri (Bp Amad)', division: 'pelindung', role: 'koordinator', order: 1 },
  { fullName: 'Agus Salim', division: 'penasihat', role: 'koordinator', order: 2 },
  { fullName: 'Aris Sunandar', division: 'ketua', role: 'koordinator', order: 3 },
  { fullName: 'Shupardi', division: 'wakil-ketua', role: 'koordinator', order: 4 },
  { fullName: 'Deden Hadiguna', division: 'sekretaris', role: 'koordinator', order: 5 },
  { fullName: 'Asep Saepullah', division: 'bendahara', role: 'koordinator', order: 6 },
  { fullName: 'Ahmad Nawawi', division: 'acara', role: 'koordinator', order: 10 },
  { fullName: 'Ahmad Nahrowi', division: 'acara', role: 'anggota', order: 11 },
  { fullName: 'Masir Manoe', division: 'acara', role: 'anggota', order: 12 },
  { fullName: 'Hanafih', division: 'perlengkapan', role: 'koordinator', order: 20 },
  { fullName: 'Nur Hidayat', division: 'perlengkapan', role: 'anggota', order: 21 },
  { fullName: 'Tabriji', division: 'perlengkapan', role: 'anggota', order: 22 },
  { fullName: 'Desya', division: 'konsumsi', role: 'koordinator', order: 30 },
  { fullName: 'Dita', division: 'konsumsi', role: 'anggota', order: 31 },
  { fullName: 'Desi', division: 'konsumsi', role: 'anggota', order: 32 },
  { fullName: 'M. Rasim', division: 'dokumentasi', role: 'koordinator', order: 40 },
  { fullName: 'Adi Maulana', division: 'dokumentasi', role: 'anggota', order: 41 },
  { fullName: 'Obi Zakaria', division: 'dokumentasi', role: 'anggota', order: 42 },
  { fullName: 'Syahrul', division: 'humas', role: 'koordinator', order: 50 },
  { fullName: 'Dedi. S', division: 'humas', role: 'anggota', order: 51 },
  { fullName: 'Hendra Prayoga', division: 'humas', role: 'anggota', order: 52 },
  { fullName: 'Muh. Ajid', division: 'keamanan', role: 'koordinator', order: 60 },
  { fullName: 'Azam', division: 'keamanan', role: 'anggota', order: 61 },
  { fullName: 'Ridho Wahyudi', division: 'keamanan', role: 'anggota', order: 62 },
];

async function ensureCommittee() {
  const db = await getDb();
  const col = db.collection('committee');
  const count = await col.countDocuments({});
  if (count === 0) {
    const docs = INITIAL_COMMITTEE.map((m) => ({
      id: uuidv4(),
      ...m,
      createdAt: new Date().toISOString(),
    }));
    await col.insertMany(docs);
  }
}

async function requireAuth(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

function json(data, init) { return NextResponse.json(data, init); }
function stripId(doc) { if (!doc) return doc; const { _id, ...r } = doc; return r; }
function stripSensitive(u) { if (!u) return u; const { _id, passwordHash, ...r } = u; return r; }

async function handleRoute(request, pathSegments) {
  const method = request.method;
  const path = '/' + (pathSegments || []).join('/');
  const db = await getDb();

  // ============= AUTH =============
  if (path === '/auth/login' && method === 'POST') {
    await ensureAdmin();
    const body = await request.json();
    const { username, password } = body || {};
    const user = await db.collection('users').findOne({ username });
    if (!user) return json({ error: 'Username atau password salah' }, { status: 401 });
    const ok = await bcrypt.compare(password || '', user.passwordHash);
    if (!ok) return json({ error: 'Username atau password salah' }, { status: 401 });
    const token = await createSession({ uid: user.id, username: user.username, role: user.role });
    const res = json({ ok: true, user: { username: user.username, role: user.role, fullName: user.fullName } });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
    return res;
  }

  if (path === '/auth/logout' && method === 'POST') {
    const res = json({ ok: true });
    res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  }

  if (path === '/auth/me' && method === 'GET') {
    const session = await requireAuth(request);
    if (!session) return json({ authenticated: false });
    const u = await db.collection('users').findOne({ id: session.uid });
    return json({ authenticated: true, user: stripSensitive(u) });
  }

  // ============= PUBLIC =============
  if (path === '/public/summary' && method === 'GET') {
    await ensureSettings();
    const settings = await db.collection('settings').findOne({ key: 'global' });
    const txs = await db.collection('transactions').find({}, { projection: { _id: 0 } }).limit(5000).toArray();
    let totalIn = 0, totalOut = 0;
    const byCategory = { warga: 0, pemuda: 0, sponsor: 0, lainnya: 0 };
    const monthly = {};
    for (const t of txs) {
      if (t.type === 'in') {
        totalIn += Number(t.amount || 0);
        const cat = (t.category || 'lainnya').toLowerCase();
        if (byCategory[cat] !== undefined) byCategory[cat] += Number(t.amount || 0);
        else byCategory.lainnya += Number(t.amount || 0);
        const ym = (t.date || '').slice(0, 7);
        if (ym) monthly[ym] = (monthly[ym] || 0) + Number(t.amount || 0);
      } else if (t.type === 'out') {
        totalOut += Number(t.amount || 0);
      }
    }
    const monthlyArr = Object.entries(monthly).sort(([a],[b]) => a.localeCompare(b)).map(([m, v]) => ({ month: m, total: v }));
    return json({
      target: settings.targetAmount,
      totalIn, totalOut,
      balance: totalIn - totalOut,
      progress: settings.targetAmount > 0 ? Math.min(100, (totalIn / settings.targetAmount) * 100) : 0,
      byCategory,
      monthly: monthlyArr,
      txCount: txs.length,
      organizationName: settings.organizationName,
      eventName: settings.eventName,
      hasProposal: !!settings.proposalFile,
    });
  }

  if (path === '/public/transactions' && method === 'GET') {
    const txs = await db.collection('transactions').find({ type: 'in' }, { projection: { _id: 0 } }).sort({ date: -1, createdAt: -1 }).limit(500).toArray();
    return json({ transactions: txs.map(stripId) });
  }

  if (path === '/public/proposal' && method === 'GET') {
    const settings = await db.collection('settings').findOne({ key: 'global' });
    if (!settings?.proposalFile) return json({ error: 'Belum ada proposal' }, { status: 404 });
    const buffer = Buffer.from(settings.proposalFile, 'base64');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': settings.proposalMimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${settings.proposalFileName || 'proposal.pdf'}"`,
      },
    });
  }

  // ============= COMMITTEE (PUBLIC) =============
  if (path === '/public/committee' && method === 'GET') {
    await ensureCommittee();
    const members = await db.collection('committee').find({}, { projection: { _id: 0 } }).sort({ order: 1 }).limit(200).toArray();
    const settings = await db.collection('settings').findOne({ key: 'global' });
    return json({
      members,
      theme: settings?.theme,
      eventDate: settings?.eventDate,
      eventLocation: settings?.eventLocation,
      visiMisi: settings?.visiMisi || [],
    });
  }

  // ============= ADMIN (protected) =============
  const session = await requireAuth(request);
  if (path.startsWith('/admin/')) {
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (path === '/admin/transactions' && method === 'GET') {
    const txs = await db.collection('transactions').find({}, { projection: { _id: 0 } }).sort({ date: -1, createdAt: -1 }).limit(1000).toArray();
    return json({ transactions: txs.map(stripId) });
  }

  if (path === '/admin/transactions' && method === 'POST') {
    const body = await request.json();
    const { date, name, category, amount, note, type } = body || {};
    if (!date || !name || !amount || !type) return json({ error: 'Field wajib: date, name, amount, type' }, { status: 400 });
    const doc = {
      id: uuidv4(), date, name: String(name).trim(),
      category: (category || 'lainnya').toLowerCase(),
      amount: Number(amount), note: note || '', type,
      createdAt: new Date().toISOString(), createdBy: session.username,
    };
    await db.collection('transactions').insertOne(doc);
    return json({ ok: true, transaction: stripId(doc) });
  }

  if (path.startsWith('/admin/transactions/') && method === 'PUT') {
    const id = path.split('/').pop();
    const body = await request.json();
    const update = {};
    ['date', 'name', 'category', 'amount', 'note', 'type'].forEach((k) => {
      if (body[k] !== undefined) update[k] = k === 'amount' ? Number(body[k]) : body[k];
    });
    update.updatedAt = new Date().toISOString();
    const result = await db.collection('transactions').updateOne({ id }, { $set: update });
    if (result.matchedCount === 0) return json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    const updated = await db.collection('transactions').findOne({ id });
    return json({ ok: true, transaction: stripId(updated) });
  }

  if (path.startsWith('/admin/transactions/') && method === 'DELETE') {
    const id = path.split('/').pop();
    const result = await db.collection('transactions').deleteOne({ id });
    if (result.deletedCount === 0) return json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    return json({ ok: true });
  }

  if (path === '/admin/settings' && method === 'GET') {
    await ensureSettings();
    const settings = await db.collection('settings').findOne({ key: 'global' });
    return json({
      targetAmount: settings.targetAmount,
      organizationName: settings.organizationName,
      eventName: settings.eventName,
      theme: settings.theme,
      eventDate: settings.eventDate,
      eventLocation: settings.eventLocation,
      visiMisi: settings.visiMisi || [],
      proposalFileName: settings.proposalFileName,
      hasProposal: !!settings.proposalFile,
    });
  }

  if (path === '/admin/settings' && method === 'PUT') {
    const body = await request.json();
    const update = {};
    if (body.targetAmount !== undefined) update.targetAmount = Number(body.targetAmount);
    if (body.organizationName !== undefined) update.organizationName = body.organizationName;
    if (body.eventName !== undefined) update.eventName = body.eventName;
    if (body.theme !== undefined) update.theme = body.theme;
    if (body.eventDate !== undefined) update.eventDate = body.eventDate;
    if (body.eventLocation !== undefined) update.eventLocation = body.eventLocation;
    if (body.visiMisi !== undefined && Array.isArray(body.visiMisi)) update.visiMisi = body.visiMisi.filter(v => v && v.trim());
    update.updatedAt = new Date().toISOString();
    await db.collection('settings').updateOne({ key: 'global' }, { $set: update });
    return json({ ok: true });
  }

  // ============= COMMITTEE (admin) =============
  if (path === '/admin/committee' && method === 'GET') {
    await ensureCommittee();
    const members = await db.collection('committee').find({}, { projection: { _id: 0 } }).sort({ order: 1 }).limit(200).toArray();
    return json({ members });
  }

  if (path === '/admin/committee' && method === 'POST') {
    const body = await request.json();
    const { fullName, division, role, order } = body || {};
    if (!fullName || !division) return json({ error: 'fullName & division wajib' }, { status: 400 });
    const doc = {
      id: uuidv4(),
      fullName: String(fullName).trim(),
      division,
      role: role || 'anggota',
      order: Number(order) || 999,
      createdAt: new Date().toISOString(),
    };
    await db.collection('committee').insertOne(doc);
    const { _id, ...clean } = doc;
    return json({ ok: true, member: clean });
  }

  if (path.startsWith('/admin/committee/') && method === 'PUT') {
    const id = path.split('/').pop();
    const body = await request.json();
    const update = {};
    ['fullName', 'division', 'role'].forEach((k) => { if (body[k] !== undefined) update[k] = body[k]; });
    if (body.order !== undefined) update.order = Number(body.order);
    update.updatedAt = new Date().toISOString();
    const r = await db.collection('committee').updateOne({ id }, { $set: update });
    if (r.matchedCount === 0) return json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    return json({ ok: true });
  }

  if (path.startsWith('/admin/committee/') && method === 'DELETE') {
    const id = path.split('/').pop();
    const r = await db.collection('committee').deleteOne({ id });
    if (r.deletedCount === 0) return json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    return json({ ok: true });
  }

  if (path === '/admin/settings/proposal' && method === 'POST') {
    const body = await request.json();
    const { fileBase64, fileName, mimeType } = body || {};
    if (!fileBase64 || !fileName) return json({ error: 'File required' }, { status: 400 });
    await db.collection('settings').updateOne(
      { key: 'global' },
      { $set: { proposalFile: fileBase64, proposalFileName: fileName, proposalMimeType: mimeType || 'application/pdf', updatedAt: new Date().toISOString() } }
    );
    return json({ ok: true });
  }

  if (path === '/admin/settings/proposal' && method === 'DELETE') {
    await db.collection('settings').updateOne(
      { key: 'global' },
      { $set: { proposalFile: null, proposalFileName: null, proposalMimeType: null } }
    );
    return json({ ok: true });
  }

  // ============= USER MANAGEMENT (admin only) =============
  if (path === '/admin/users' && method === 'GET') {
    if (session.role !== 'admin') return json({ error: 'Hanya admin yang bisa mengakses' }, { status: 403 });
    const users = await db.collection('users').find({}, { projection: { passwordHash: 0, _id: 0 } }).sort({ createdAt: 1 }).limit(200).toArray();
    return json({ users: users.map(stripSensitive) });
  }

  if (path === '/admin/users' && method === 'POST') {
    if (session.role !== 'admin') return json({ error: 'Hanya admin yang bisa membuat user' }, { status: 403 });
    const body = await request.json();
    const { username, password, fullName, role } = body || {};
    if (!username || !password) return json({ error: 'username & password wajib' }, { status: 400 });
    const existing = await db.collection('users').findOne({ username });
    if (existing) return json({ error: 'Username sudah dipakai' }, { status: 400 });
    const hash = await bcrypt.hash(password, 10);
    const doc = {
      id: uuidv4(), username, passwordHash: hash,
      fullName: fullName || username,
      role: ['admin', 'bendahara', 'pengurus'].includes(role) ? role : 'pengurus',
      createdAt: new Date().toISOString(),
    };
    await db.collection('users').insertOne(doc);
    return json({ ok: true, user: stripSensitive(doc) });
  }

  if (path.startsWith('/admin/users/') && method === 'PUT') {
    if (session.role !== 'admin') return json({ error: 'Forbidden' }, { status: 403 });
    const id = path.split('/').pop();
    const body = await request.json();
    const update = {};
    if (body.fullName !== undefined) update.fullName = body.fullName;
    if (body.role !== undefined && ['admin', 'bendahara', 'pengurus'].includes(body.role)) update.role = body.role;
    if (body.password) update.passwordHash = await bcrypt.hash(body.password, 10);
    update.updatedAt = new Date().toISOString();
    const r = await db.collection('users').updateOne({ id }, { $set: update });
    if (r.matchedCount === 0) return json({ error: 'User tidak ditemukan' }, { status: 404 });
    return json({ ok: true });
  }

  if (path.startsWith('/admin/users/') && method === 'DELETE') {
    if (session.role !== 'admin') return json({ error: 'Forbidden' }, { status: 403 });
    const id = path.split('/').pop();
    if (id === session.uid) return json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });
    const r = await db.collection('users').deleteOne({ id });
    if (r.deletedCount === 0) return json({ error: 'User tidak ditemukan' }, { status: 404 });
    return json({ ok: true });
  }

  // ============= EXPORT =============
  if (path === '/admin/export' && method === 'GET') {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const filter = type ? { type } : {};
    const txs = await db.collection('transactions').find(filter, { projection: { _id: 0 } }).sort({ date: 1, createdAt: 1 }).limit(10000).toArray();
    const rows = txs.map((t) => ({
      Tanggal: t.date, Nama: t.name, Kategori: t.category,
      Jenis: t.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
      Jumlah: t.amount, Keterangan: t.note || '', Dibuat: t.createdAt,
    }));
    const csv = Papa.unparse(rows);
    return new NextResponse('\uFEFF' + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="rekap-keuangan-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  }

  if (path === '/admin/export/excel' && method === 'GET') {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const filter = type ? { type } : {};
    const txs = await db.collection('transactions').find(filter, { projection: { _id: 0 } }).sort({ date: 1, createdAt: 1 }).limit(10000).toArray();
    const rows = txs.map((t) => ({
      Tanggal: t.date, Nama: t.name, Kategori: t.category,
      Jenis: t.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
      Jumlah: t.amount, Keterangan: t.note || '', Dibuat: t.createdAt,
    }));
    const totalIn = txs.filter(t => t.type === 'in').reduce((s, t) => s + Number(t.amount), 0);
    const totalOut = txs.filter(t => t.type === 'out').reduce((s, t) => s + Number(t.amount), 0);
    rows.push({});
    rows.push({ Tanggal: 'TOTAL PEMASUKAN', Jumlah: totalIn });
    rows.push({ Tanggal: 'TOTAL PENGELUARAN', Jumlah: totalOut });
    rows.push({ Tanggal: 'SALDO', Jumlah: totalIn - totalOut });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Keuangan');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rekap-keuangan-${new Date().toISOString().slice(0,10)}.xlsx"`,
      },
    });
  }

  if (path === '/' || path === '') return json({ name: 'LIPPO 13 Pulo Ngandang - Sistem Keuangan', status: 'ok' });

  return json({ error: 'Not found', path }, { status: 404 });
}

const wrap = (fn) => async (request, ctx) => {
  try {
    const params = await ctx.params;
    return await handleRoute(request, params?.path);
  } catch (e) {
    console.error('API error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
};

export const GET = wrap();
export const POST = wrap();
export const PUT = wrap();
export const DELETE = wrap();
