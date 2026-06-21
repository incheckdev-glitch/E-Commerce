import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'L&C Perfume | Luxury Fragrance Store',
  description: 'L&C Perfume luxury ecommerce store built with Next.js, Supabase, Vercel, and GitHub.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <footer className="footer">
          <div className="container footer-grid">
            <div className="footer-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/lc-logo.jpeg" alt="L&C Perfume" />
              <p>Timeless scents, crafted for elegance. Premium fragrances, gift sets, oud, musk, amber, and signature collections.</p>
              <div className="social-row">
                <span>f</span><span>ig</span><span>tt</span><span>yt</span>
              </div>
            </div>
            <div>
              <h3>Quick Links</h3>
              <a href="/">Home</a>
              <a href="/shop">Shop</a>
              <a href="/fragrance-finder">Fragrance Finder</a>
              <a href="/wishlist">Wishlist</a>
              <a href="/shop?scent=oud">Oud Collection</a>
            </div>
            <div>
              <h3>Customer Care</h3>
              <a href="/track">Track Order</a>
              <a href="/cart">Cart</a>
              <a href="/checkout">Checkout</a>
              <a href="/login">My Account</a>
              <a href="/admin">Admin</a>
            </div>
            <div>
              <h3>Contact Us</h3>
              <p>+961 00 000 000</p>
              <p>info@lcperfume.com</p>
              <p>Luxury fragrance boutique</p>
              <p className="payment-line">Visa · Mastercard · Cash on Delivery</p>
            </div>
          </div>
          <div className="container footer-bottom">
            <span>© 2026 L&C Perfume. All Rights Reserved.</span>
            <span>Luxury in every drop.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
