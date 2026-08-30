export interface Store {
  id: string;
  store_code: string;
  pin_code: string;
  name: string;
  created_at?: string;
}

export interface Product {
  id: string;
  store_id: string;
  barcode: string;
  name: string;
  buy_price: number;
  sell_price: number;
  image_url?: string | null;
  category?: string;
  stock_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string; // Unique cart item ID (since user wants separate lines per scan)
  product: Product;
  scanned_at: number;
}

export interface Sale {
  id: string;
  store_id: string;
  total_amount: number;
  given_amount: number;
  change_amount: number;
  created_at?: string;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id?: string | null;
  product_name: string;
  barcode: string;
  sell_price: number;
  buy_price: number;
}
