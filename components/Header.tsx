import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { CartCounter } from '@/components/CartCounter';

export function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">MAISON</Link>
        <nav className="nav">
          <Link href="/shop">Shop</Link>
          <Link href="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShoppingBag size={18} /> Cart <CartCounter />
          </Link>
          <Link href="/login">Login</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
