import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
} from 'firebase/storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  Auth,
  updateProfile,
  User,
} from 'firebase/auth';

import { Product, Order, User as UserModel } from '../models';

/**
 * Firebase service class for handling database and authentication operations
 */
export class FirebaseService {
  private db: Firestore;
  private auth: Auth;
  private storage: FirebaseStorage;

  constructor(db: Firestore, auth: Auth, storage: FirebaseStorage) {
    this.db = db;
    this.auth = auth;
    this.storage = storage;
  }

  // *** Auth API ***

  /**
   * Create a new user with email and password
   */
  async createUser(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    return userCredential.user;
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    return userCredential.user;
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  /**
   * Send a password reset email
   */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(user: User, displayName?: string, photoURL?: string): Promise<void> {
    await updateProfile(user, {
      displayName: displayName || user.displayName,
      photoURL: photoURL || user.photoURL,
    });
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // *** Firestore API ***

  /**
   * Get all products
   */
  async getProducts(): Promise<Product[]> {
    const productsRef = collection(this.db, 'products');
    const productsSnapshot = await getDocs(productsRef);
    
    return productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const productsRef = collection(this.db, 'products');
    const q = query(productsRef, where('category', '==', categoryId));
    const productsSnapshot = await getDocs(q);
    
    return productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  }

  /**
   * Get a product by ID
   */
  async getProductById(productId: string): Promise<Product | null> {
    const productRef = doc(this.db, 'products', productId);
    const productSnapshot = await getDoc(productRef);
    
    if (productSnapshot.exists()) {
      return {
        id: productSnapshot.id,
        ...productSnapshot.data(),
      } as Product;
    }
    
    return null;
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limitCount: number = 4): Promise<Product[]> {
    const productsRef = collection(this.db, 'products');
    const q = query(
      productsRef,
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const productsSnapshot = await getDocs(q);
    
    return productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    const ordersRef = collection(this.db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const ordersSnapshot = await getDocs(q);
    
    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Order));
  }

  /**
   * Create a new order
   */
  async createOrder(order: Omit<Order, 'id'>): Promise<string> {
    const ordersRef = collection(this.db, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...order,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return docRef.id;
  }

  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(path: string, file: Blob): Promise<string> {
    const storageRef = ref(this.storage, path);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(this.storage, path);
    await deleteObject(storageRef);
  }
}

// Export a function to create the service with injected dependencies
export const createFirebaseService = (
  db: Firestore,
  auth: Auth,
  storage: FirebaseStorage
): FirebaseService => {
  return new FirebaseService(db, auth, storage);
};