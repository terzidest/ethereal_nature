export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  addresses?: Address[];
  phoneNumber?: string;
  wishlist?: string[]; // Array of product IDs
  emailVerified: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Address {
  id: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}
