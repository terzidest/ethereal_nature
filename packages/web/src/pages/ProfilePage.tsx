import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile' | 'settings'>('profile');
  
  // Mock user data 
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const user = isLoggedIn ? {
    id: 'user123',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    photoURL: 'https://via.placeholder.com/150',
    phone: '(555) 123-4567',
  } : null;

  // Mock order data
  const orders = [
    {
      id: 'ORD12345',
      date: 'Apr 3, 2023',
      status: 'Delivered',
      total: 89.97,
      items: [
        {
          id: '1',
          name: 'Lavender Essential Oil',
          price: 24.99,
          quantity: 2,
        },
        {
          id: '5',
          name: 'Natural Face Serum',
          price: 39.99,
          quantity: 1,
        },
      ],
    },
    {
      id: 'ORD12346',
      date: 'Mar 15, 2023',
      status: 'Delivered',
      total: 54.98,
      items: [
        {
          id: '7',
          name: 'Peppermint Essential Oil',
          price: 22.99,
          quantity: 1,
        },
        {
          id: '2',
          name: 'Meditation Cushion Set',
          price: 32.99,
          quantity: 1,
        },
      ],
    },
  ];

  // Mock address data
  const addresses = [
    {
      id: 'addr1',
      isDefault: true,
      name: 'Jane Smith',
      street: '123 Main St',
      apartment: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
      phone: '(555) 123-4567',
    },
    {
      id: 'addr2',
      isDefault: false,
      name: 'Jane Smith',
      street: '456 Work Ave',
      apartment: '',
      city: 'New York',
      state: 'NY',
      postalCode: '10002',
      country: 'United States',
      phone: '(555) 987-6543',
    },
  ];

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    // signOut
    setIsLoggedIn(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Not logged in view
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white p-6 rounded-full inline-block mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-nature-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign In to Your Account</h1>
          <p className="text-gray-600 mb-8">
            Please sign in to view your profile, orders, and saved addresses.
          </p>
          <Link to="/auth" className="btn btn-primary px-8 py-3 mb-4 inline-block">
            Sign In
          </Link>
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/auth" className="text-nature-dark font-medium">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-4 py-3 rounded-md text-left ${
                  activeTab === 'profile' ? 'bg-nature-light text-nature-dark font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`mr-3 h-5 w-5 ${activeTab === 'profile' ? 'text-nature-dark' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center px-4 py-3 rounded-md text-left ${
                  activeTab === 'orders' ? 'bg-nature-light text-nature-dark font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`mr-3 h-5 w-5 ${activeTab === 'orders' ? 'text-nature-dark' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Orders
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center px-4 py-3 rounded-md text-left ${
                  activeTab === 'addresses' ? 'bg-nature-light text-nature-dark font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`mr-3 h-5 w-5 ${activeTab === 'addresses' ? 'text-nature-dark' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Addresses
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center px-4 py-3 rounded-md text-left ${
                  activeTab === 'settings' ? 'bg-nature-light text-nature-dark font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`mr-3 h-5 w-5 ${activeTab === 'settings' ? 'text-nature-dark' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 rounded-md text-red-600 hover:bg-red-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      className="input w-full"
                      defaultValue={user?.name}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      id="email"
                      className="input w-full"
                      defaultValue={user?.email}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      className="input w-full"
                      defaultValue={user?.phone}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>
                  <div className="flex items-center">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-5">
                      <button type="button" className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nature-medium">
                        Change
                      </button>
                      <p className="mt-1 text-xs text-gray-500">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        id="current-password"
                        className="input w-full"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        id="new-password"
                        className="input w-full"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirm-password"
                        className="input w-full"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nature-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-nature-dark hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nature-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Order History</h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't placed any orders yet.</p>
                  <div className="mt-6">
                    <Link to="/products" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-nature-dark hover:bg-opacity-90">
                      Start shopping
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Order</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{order.id}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{order.date}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                              {order.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${order.total.toFixed(2)}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button className="text-nature-dark hover:text-nature-medium">
                              View<span className="sr-only">, {order.id}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Saved Addresses</h2>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-nature-dark hover:bg-opacity-90">
                  Add New Address
                </button>
              </div>
              
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't added any addresses yet.</p>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4 relative">
                      {address.isDefault && (
                        <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Default
                        </span>
                      )}
                      <div className="mb-4 mt-2">
                        <h3 className="text-lg font-medium text-gray-900">{address.name}</h3>
                      </div>
                      <div className="text-gray-700 space-y-1">
                        <p>{address.street}</p>
                        {address.apartment && <p>{address.apartment}</p>}
                        <p>{address.city}, {address.state} {address.postalCode}</p>
                        <p>{address.country}</p>
                        <p className="pt-2">{address.phone}</p>
                      </div>
                      <div className="mt-4 flex space-x-3">
                        <button type="button" className="text-sm font-medium text-nature-dark hover:text-nature-medium">
                          Edit
                        </button>
                        {!address.isDefault && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button type="button" className="text-sm font-medium text-nature-dark hover:text-nature-medium">
                              Set as default
                            </button>
                          </>
                        )}
                        <span className="text-gray-300">|</span>
                        <button type="button" className="text-sm font-medium text-red-600 hover:text-red-500">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage how you receive notifications and updates.</p>
                  
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id="email-notifications"
                          name="email-notifications"
                          type="checkbox"
                          className="h-4 w-4 text-nature-dark focus:ring-nature-medium border-gray-300 rounded"
                          checked={emailNotifications}
                          onChange={() => setEmailNotifications(!emailNotifications)}
                        />
                        <label htmlFor="email-notifications" className="ml-3 block text-sm font-medium text-gray-700">
                          Email Notifications
                        </label>
                      </div>
                      <span className="text-sm text-gray-500">Receive order updates and promotions</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Appearance</h3>
                  <p className="mt-1 text-sm text-gray-500">Customize your visual experience.</p>
                  
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id="dark-mode"
                          name="dark-mode"
                          type="checkbox"
                          className="h-4 w-4 text-nature-dark focus:ring-nature-medium border-gray-300 rounded"
                          checked={darkMode}
                          onChange={() => setDarkMode(!darkMode)}
                        />
                        <label htmlFor="dark-mode" className="ml-3 block text-sm font-medium text-gray-700">
                          Dark Mode
                        </label>
                      </div>
                      <span className="text-sm text-gray-500">Coming soon</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Account Management</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage your account settings and privacy.</p>
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <button
                        type="button"
                        className="text-nature-dark hover:text-nature-medium font-medium"
                      >
                        Export my data
                      </button>
                      <p className="mt-1 text-xs text-gray-500">Download all your personal data in a CSV format</p>
                    </div>
                    
                    <div>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-500 font-medium"
                      >
                        Delete my account
                      </button>
                      <p className="mt-1 text-xs text-gray-500">Permanently remove your account and all data</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-5 border-t border-gray-200">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nature-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-nature-dark hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nature-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;