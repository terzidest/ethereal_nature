import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [saveInfo, setSaveInfo] = useState(false);

  // Mock cart items and totals 
  const cartItems = [
    {
      id: '1',
      name: 'Lavender Essential Oil',
      price: 24.99,
      quantity: 2,
      imageUrl: 'https://via.placeholder.com/300x300?text=Lavender+Oil',
    },
    {
      id: '5',
      name: 'Natural Face Serum',
      price: 39.99,
      quantity: 1,
      imageUrl: 'https://via.placeholder.com/300x300?text=Face+Serum',
    },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 4.99;
  const tax = parseFloat((subtotal * 0.08).toFixed(2));
  const total = subtotal + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo({
      ...shippingInfo,
      [name]: value,
    });
  };

  const isShippingComplete = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'postalCode'];
    return requiredFields.every(field => (shippingInfo as any)[field].trim() !== '');
  };

  const handleContinue = () => {
    if (activeStep === 'shipping') {
      if (!isShippingComplete()) {
        toast.error('Please fill in all required fields');
        return;
      }
      setActiveStep('payment');
      window.scrollTo(0, 0);
    } else if (activeStep === 'payment') {
      setActiveStep('review');
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (activeStep === 'payment') {
      setActiveStep('shipping');
    } else if (activeStep === 'review') {
      setActiveStep('payment');
    }
    window.scrollTo(0, 0);
  };

  const handlePlaceOrder = () => {
    // dummy submit order 
    toast.success('Order placed successfully!');
    // Redirect to confirmation page or home
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {/* Checkout Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-nature-dark text-white">
              1
            </div>
            <div className="ml-3">
              <div className={`font-medium ${activeStep === 'shipping' ? 'text-nature-dark' : 'text-gray-900'}`}>Shipping</div>
              <div className="text-sm text-gray-500">Delivery details</div>
            </div>
          </div>
          <div className="hidden sm:block w-24 h-0.5 bg-gray-200"></div>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              activeStep === 'payment' || activeStep === 'review' ? 'bg-nature-dark text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              2
            </div>
            <div className="ml-3">
              <div className={`font-medium ${activeStep === 'payment' ? 'text-nature-dark' : 'text-gray-900'}`}>Payment</div>
              <div className="text-sm text-gray-500">Payment method</div>
            </div>
          </div>
          <div className="hidden sm:block w-24 h-0.5 bg-gray-200"></div>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              activeStep === 'review' ? 'bg-nature-dark text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              3
            </div>
            <div className="ml-3">
              <div className={`font-medium ${activeStep === 'review' ? 'text-nature-dark' : 'text-gray-900'}`}>Review</div>
              <div className="text-sm text-gray-500">Order summary</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Checkout Form */}
        <div className="md:col-span-2">
          {/* Shipping Step */}
          {activeStep === 'shipping' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="input w-full"
                    value={shippingInfo.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="input w-full"
                    value={shippingInfo.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input w-full"
                    value={shippingInfo.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="input w-full"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="input w-full"
                  value={shippingInfo.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-1">
                  Apartment, suite, etc. (optional)
                </label>
                <input
                  type="text"
                  id="apartment"
                  name="apartment"
                  className="input w-full"
                  value={shippingInfo.apartment}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className="input w-full"
                    value={shippingInfo.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    className="input w-full"
                    value={shippingInfo.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    className="input w-full"
                    value={shippingInfo.postalCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="country"
                    name="country"
                    className="input w-full"
                    value={shippingInfo.country}
                    onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                    required
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <input
                  id="saveInfo"
                  name="saveInfo"
                  type="checkbox"
                  className="h-4 w-4 text-nature-dark focus:ring-nature-dark border-gray-300 rounded"
                  checked={saveInfo}
                  onChange={() => setSaveInfo(!saveInfo)}
                />
                <label htmlFor="saveInfo" className="ml-2 block text-sm text-gray-700">
                  Save this information for next time
                </label>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {activeStep === 'payment' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
              
              <div className="space-y-4 mb-6">
                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer ${paymentMethod === 'card' ? 'border-nature-dark bg-nature-light bg-opacity-30' : 'border-gray-300'}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="flex items-center">
                    <input
                      id="card"
                      name="paymentMethod"
                      type="radio"
                      className="h-4 w-4 text-nature-dark focus:ring-nature-dark border-gray-300"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <label htmlFor="card" className="ml-3 block font-medium text-gray-700">
                      Credit / Debit Card
                    </label>
                  </div>
                  
                  {paymentMethod === 'card' && (
                    <div className="mt-4 ml-7">
                      <div className="mb-4">
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          className="input w-full"
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            id="expiryDate"
                            name="expiryDate"
                            className="input w-full"
                            placeholder="MM / YY"
                          />
                        </div>
                        <div>
                          <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            id="cvc"
                            name="cvc"
                            className="input w-full"
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer ${paymentMethod === 'paypal' ? 'border-nature-dark bg-nature-light bg-opacity-30' : 'border-gray-300'}`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <div className="flex items-center">
                    <input
                      id="paypal"
                      name="paymentMethod"
                      type="radio"
                      className="h-4 w-4 text-nature-dark focus:ring-nature-dark border-gray-300"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                    />
                    <label htmlFor="paypal" className="ml-3 block font-medium text-gray-700">
                      PayPal
                    </label>
                  </div>
                  
                  {paymentMethod === 'paypal' && (
                    <div className="mt-4 ml-7">
                      <p className="text-gray-600">
                        You will be redirected to PayPal to complete your purchase securely.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Test Mode
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        This checkout is in test mode...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Step */}
          {activeStep === 'review' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Review Your Order</h2>
              
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Shipping Address</h3>
                  <button
                    type="button"
                    className="text-nature-dark text-sm"
                    onClick={() => setActiveStep('shipping')}
                  >
                    Edit
                  </button>
                </div>
                <p className="text-gray-700">
                  {shippingInfo.firstName} {shippingInfo.lastName}<br />
                  {shippingInfo.address} {shippingInfo.apartment && `, ${shippingInfo.apartment}`}<br />
                  {shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}<br />
                  {shippingInfo.country}<br />
                  {shippingInfo.phone}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Payment Method</h3>
                  <button
                    type="button"
                    className="text-nature-dark text-sm"
                    onClick={() => setActiveStep('payment')}
                  >
                    Edit
                  </button>
                </div>
                <p className="text-gray-700">
                  {paymentMethod === 'card' ? 'Credit / Debit Card' : 'PayPal'}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-4">Items in Your Order</h3>
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex py-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-6 flex flex-1 flex-col">
                        <div className="flex">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm">
                              <Link to={`/products/${item.id}`} className="font-medium text-gray-700 hover:text-gray-800">
                                {item.name}
                              </Link>
                            </h4>
                          </div>
                          <div className="ml-4 flow-root flex-shrink-0">
                            <p className="text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex justify-between">
            {activeStep !== 'shipping' ? (
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                onClick={handleBack}
              >
                Back
              </button>
            ) : (
              <Link
                to="/cart"
                className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Cart
              </Link>
            )}
            
            {activeStep !== 'review' ? (
              <button
                type="button"
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-nature-dark hover:bg-opacity-90"
                onClick={handleContinue}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-nature-dark hover:bg-opacity-90"
                onClick={handlePlaceOrder}
              >
                Place Order
              </button>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-6">Order Summary</h2>
            
            <div className="flow-root">
              <ul className="-my-4 divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex items-center py-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3 className="line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <p className="text-gray-500">Qty {item.quantity}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex justify-between text-base font-medium text-gray-900 mb-2">
                <p>Subtotal</p>
                <p>${subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-base font-medium text-gray-900 mb-2">
                <p>Shipping</p>
                <p>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</p>
              </div>
              <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                <p>Tax</p>
                <p>${tax.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <p>Total</p>
                <p>${total.toFixed(2)}</p>
              </div>
              
              <div className="mt-6">
                <div className="rounded-md border border-green-200 bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Order Qualifies for Free Shipping</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;