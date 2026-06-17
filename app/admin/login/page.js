'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login gagal');
      } else {
        toast.success('Selamat datang, ' + data.user.username);
        router.push('/admin');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="relative w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-white/80 hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke halaman publik
        </Link>
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center mb-3 shadow-md">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-xl text-red-700">Panel Pengurus</CardTitle>
            <CardDescription>Karang Taruna Kp. Pulo Ngandang</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required autoComplete="username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
                <Lock className="w-4 h-4 mr-2" /> {loading ? 'Memproses...' : 'Masuk'}
              </Button>
              <p className="text-xs text-center text-muted-foreground pt-2">Default: admin / admin123</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
