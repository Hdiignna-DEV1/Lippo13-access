import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { createSession, verifyToken, SESSION_COOKIE } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

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
      organizationName: 'Karang Taruna Kp. Pulo Ngandang',
      eventName: 'HUT RI ke-80',
      proposalFile: null,
      proposalFileName: null,
      proposalMimeType: null,
      updatedAt: new Date().toISOString(),
    });
  }
}

async function requireAuth(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

function json(data, init) {
  return NextResponse.json(data, init);
}

function stripId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

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
    const res = json({ ok: true, user: { username: user.username, role: user.role } });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
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
    return json({ authenticated: true, user: { username: session.username, role: session.role } });
  }

  // ============= PUBLIC =============
  if (path === '/public/summary' && method === 'GET') {
    await ensureSettings();
    const settings = await db.collection('settings').findOne({ key: 'global' });
    const txs = await db.collection('transactions').find({}).toArray();
    let totalIn = 0, totalOut = 0;
    const byCategory = { warga: 0, pemuda: 0, sponsor: 0, lainnya: 0 };
    for (const t of txs) {
      if (t.type === 'in') {
        totalIn += Number(t.amount || 0);
        const cat = (t.category || 'lainnya').toLowerCase();
        if (byCategory[cat] !== undefined) byCategory[cat] += Number(t.amount || 0);
        else byCategory.lainnya += Number(t.amount || 0);
      } else if (t.type === 'out') {
        totalOut += Number(t.amount || 0);
      }
    }
    return json({
      target: settings.targetAmount,
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      progress: settings.targetAmount > 0 ? Math.min(100, (totalIn / settings.targetAmount) * 100) : 0,
      byCategory,
      txCount: txs.length,
      organizationName: settings.organizationName,
      eventName: settings.eventName,
      hasProposal: !!settings.proposalFile,
    });
  }

  if (path === '/public/transactions' && method === 'GET') {
    const txs = await db.collection('transactions')
      .find({ type: 'in' })
      .sort({ date: -1, createdAt: -1 })
      .toArray();
    return json({ transactions: txs.map(stripId) });
  }

  if (path === '/public/proposal' && method === 'GET') {
    const settings = await db.collection('settings').findOne({ key: 'global' });
    if (!settings?.proposalFile) {
      return json({ error: 'Belum ada proposal' }, { status: 404 });
    }
    const buffer = Buffer.from(settings.proposalFile, 'base64');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': settings.proposalMimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${settings.proposalFileName || 'proposal.pdf'}"`,
      },
    });
  }

  // ============= ADMIN (protected) =============
  const session = await requireAuth(request);
  if (path.startsWith('/admin/')) {
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (path === '/admin/transactions' && method === 'GET') {
    const txs = await db.collection('transactions')
      .find({})
      .sort({ date: -1, createdAt: -1 })
      .toArray();
    return json({ transactions: txs.map(stripId) });
  }

  if (path === '/admin/transactions' && method === 'POST') {
    const body = await request.json();
    const { date, name, category, amount, note, type } = body || {};
    if (!date || !name || !amount || !type) {
      return json({ error: 'Field wajib: date, name, amount, type' }, { status: 400 });
    }
    const doc = {
      id: uuidv4(),
      date,
      name: String(name).trim(),
      category: (category || 'lainnya').toLowerCase(),
      amount: Number(amount),
      note: note || '',
      type, // 'in' or 'out'
      createdAt: new Date().toISOString(),
      createdBy: session.username,
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
    update.updatedAt = new Date().toISOString();
    await db.collection('settings').updateOne({ key: 'global' }, { $set: update });
    return json({ ok: true });
  }

  if (path === '/admin/settings/proposal' && method === 'POST') {
    const body = await request.json();
    const { fileBase64, fileName, mimeType } = body || {};
    if (!fileBase64 || !fileName) return json({ error: 'File required' }, { status: 400 });
    await db.collection('settings').updateOne(
      { key: 'global' },
      {
        $set: {
          proposalFile: fileBase64,
          proposalFileName: fileName,
          proposalMimeType: mimeType || 'application/pdf',
          updatedAt: new Date().toISOString(),
        },
      }
    );
    return json({ ok: true });
  }

  if (path === '/admin/settings/proposal' && method === 'DELETE') {
    await db.collection('settings').updateOne(
      { key: 'global' },
      {
        $set: {
          proposalFile: null,
          proposalFileName: null,
          proposalMimeType: null,
        },
      }
    );
    return json({ ok: true });
  }

  if (path === '/admin/export' && method === 'GET') {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'in' | 'out' | null (all)
    const filter = type ? { type } : {};
    const txs = await db.collection('transactions')
      .find(filter)
      .sort({ date: 1, createdAt: 1 })
      .toArray();
    const rows = txs.map((t) => ({
      Tanggal: t.date,
      Nama: t.name,
      Kategori: t.category,
      Jenis: t.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
      Jumlah: t.amount,
      Keterangan: t.note || '',
      Dibuat: t.createdAt,
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

  if (path === '/' || path === '') {
    return json({ name: 'Karang Taruna Pulo Ngandang - Sistem Keuangan', status: 'ok' });
  }

  return json({ error: 'Not found', path }, { status: 404 });
}

export async function GET(request, { params }) {
  try {
    const resolved = await params;
    return await handleRoute(request, resolved?.path);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
export async function POST(request, { params }) {
  try {
    const resolved = await params;
    return await handleRoute(request, resolved?.path);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
export async function PUT(request, { params }) {
  try {
    const resolved = await params;
    return await handleRoute(request, resolved?.path);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
export async function DELETE(request, { params }) {
  try {
    const resolved = await params;
    return await handleRoute(request, resolved?.path);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
