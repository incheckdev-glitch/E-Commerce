export type Money = number;

export type CartItem = {
  variantId: string;
  productSlug: string;
  productName: string;
  brandName: string;
  sizeMl: number;
  concentration: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

export type CheckoutItem = {
  variant_id: string;
  quantity: number;
};

export type AdminRole = 'admin' | 'manager' | 'warehouse' | 'support' | 'accounting';
