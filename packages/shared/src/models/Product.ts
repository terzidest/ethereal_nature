export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  imageUrls: string[];
  category: string;
  subcategory?: string;
  inStock: boolean;
  featured?: boolean;
  isNew?: boolean;
  rating?: number;
  reviews?: number;
  volume?: string; // e.g., "30ml", "50ml"
  benefits?: string[];
  ingredients?: string[];
  usageInstructions?: string;
  scentNotes?: {
    top?: string[];
    middle?: string[];
    base?: string[];
  };
  createdAt: number;
  updatedAt: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: number;
}
