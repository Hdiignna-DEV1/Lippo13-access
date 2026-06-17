import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Karang Taruna Pulo Ngandang - Keuangan HUT RI',
  description: 'Sistem Informasi Pengelolaan Keuangan Karang Taruna Kp. Pulo Ngandang. Transparansi iuran warga & pemuda untuk persiapan HUT RI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
