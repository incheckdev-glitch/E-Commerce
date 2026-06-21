import Link from 'next/link';
import { Headphones, Heart, PackageCheck, Search, ShoppingBag, Sparkles, Truck, User } from 'lucide-react';
import { CartCounter } from '@/components/CartCounter';

export function Header() {
  return (
    <header className="header">
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span><Truck size={14} /> Free shipping on orders over $99</span>
          <span className="top-strip-right"><PackageCheck size={14} /> <Link href="/track">Track Order</Link> <b>|</b> <Headphones size={14} /> Customer Care</span>
        </div>
      </div>

      <div className="container header-inner">
        <nav className="nav nav-left" aria-label="Main navigation left">
          <Link href="/" className="active">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/fragrance-finder"><Sparkles size={15} /> Finder</Link>
          <Link href="/shop?gender=women">Women</Link>
        </nav>

        <Link href="/" className="logo" aria-label="L&C Perfume home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lc-logo.jpeg" alt="L&C Perfume" />
        </Link>

        <nav className="nav nav-right" aria-label="Main navigation right">
          <Link href="/shop?gender=men">Men</Link>
          <Link href="/shop?gender=unisex">Unisex</Link>
          <Link href="/shop?scent=oud">Oud</Link>
          <Link href="/wishlist" aria-label="Wishlist"><Heart size={18} /></Link>
          <Link href="/shop" aria-label="Search"><Search size={18} /></Link>
          <Link href="/login" aria-label="Account"><User size={18} /></Link>
          <Link href="/cart" className="cart-link" aria-label="Cart">
            <ShoppingBag size={18} /> <CartCounter />
          </Link>
        </nav>
      </div>
    </header>
  );
}
