export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  volume?: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  discount?: number;
  shippingCost?: number;
  totalAmount: number;
  couponCode?: string;
}
