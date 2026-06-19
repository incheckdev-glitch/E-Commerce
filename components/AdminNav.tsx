import Link from 'next/link';

export function AdminNav() {
  return (
    <aside className="admin-nav">
      <Link href="/admin">Dashboard</Link>
      <Link href="/admin/products">Products</Link>
      <Link href="/admin/orders">Orders</Link>
      <Link href="/shop">View Store</Link>
    </aside>
  );
}
