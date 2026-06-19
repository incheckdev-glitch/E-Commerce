import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Maison Perfume Store',
  description: 'Perfume ecommerce MVP built with Next.js, Supabase, Vercel, and GitHub.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <footer className="footer">
          <div className="container">
            <strong>Maison Perfume Store</strong>
            <p>Perfume ecommerce starter: catalog, cart, checkout, orders, admin, inventory, and Supabase backend.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
