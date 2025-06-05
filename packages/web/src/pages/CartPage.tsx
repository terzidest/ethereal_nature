import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const CartPage = () => {
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');

  // Mock cart data 
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      name: 'Lavender Essential Oil',
      description: 'Pure lavender essential oil for relaxation and stress relief.',
      price: 24.99,
      quantity: 2,
      imageUrl: 'https://via.placeholder.com/300x300?text=Lavender+Oil',
    },
    {
      id: '5',
      name: 'Natural Face Serum',
      description: 'Rejuvenating serum with plant-based ingredients.',
      price: 39.99,
      quantity: 1,
      imageUrl: 'https://via.placeholder.com/300x300?text=Face+Serum',
    },
  ]);

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 4.99;
  const discount = 0; // Would be calculated based on promo code
  const total = subtotal + shipping - discount;

  const updateItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove item if quantity < 1
      setCartItems(cartItems.filter(item => item.id !== id));
      toast.success('Item removed from cart');
    } else {
      // Update quantity
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
      toast.success('Cart updated');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    // dummy validate and apply promo code 
    if (promoCode.toLowerCase() === 'welcome15') {
      toast.success('Promo code applied: 15% off');
    } else {
      toast.error('Invalid promo code');
    }
  };

  // Empty cart view
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white p-6 rounded-full inline-block mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-nature-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any products to your cart yet.
            Browse our products and find something you'll love.
          </p>
          <Link to="/products" className="btn btn-primary px-8 py-3">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Cart Items ({cartItems.length})</h2>
            
            <div className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <div key={item.id} className="flex py-6">
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>
                          <Link to={`/products/${item.id}`}>
                            {item.name}
                          </Link>
                        </h3>
                        <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center">
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="mx-2 text-gray-700">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, 0)}
                        className="font-medium text-red-600 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="flex justify-between">
            <Link
              to="/products"
              className="flex items-center text-nature-dark hover:text-nature-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Continue Shopping
            </Link>
            <button
              onClick={() => setCartItems([])}
              className="text-red-600 hover:text-red-800"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-xl text-nature-dark">${total.toFixed(2)}</span>
                </div>
              </div>

              {subtotal < 50 && (
                <div className="bg-nature-light p-4 rounded-lg mt-4">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-nature-dark mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    <div>
                      <p className="text-gray-700">
                        Add ${(50 - subtotal).toFixed(2)} more to get <strong>free shipping!</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Promo Code */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Promo Code</h2>
            <form onSubmit={handleApplyPromo} className="flex">
              <input
                type="text"
                placeholder="Enter promo code"
                className="input flex-1 rounded-r-none"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button
                type="submit"
                className="bg-nature-dark text-white px-4 py-2 font-medium rounded-r-md hover:bg-opacity-90 transition-colors"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            className="btn btn-primary w-full py-3 text-lg"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;