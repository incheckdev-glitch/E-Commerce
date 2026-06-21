import Link from 'next/link';

export function AdminNav() {
  return (
    <aside className="admin-nav">
      <Link href="/admin">Dashboard</Link>
      <Link href="/admin/products">Products</Link>
      <Link href="/admin/inventory">Inventory</Link>
      <Link href="/admin/orders">Orders</Link>
      <Link href="/admin/customers">Customers</Link>
      <Link href="/admin/coupons">Coupons</Link>
      <Link href="/admin/delivery">Delivery Zones</Link>
      <Link href="/admin/reviews">Reviews</Link>
      <Link href="/admin/reports">Reports</Link>
      <Link href="/shop">View Store</Link>
    </aside>
  );
}
