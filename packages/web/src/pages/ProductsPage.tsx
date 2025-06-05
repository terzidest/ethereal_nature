import React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const searchQuery = searchParams.get('search');
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Mock products data
  const products = [
    {
      id: '1',
      name: 'Lavender Essential Oil',
      description: 'Pure lavender essential oil for relaxation and stress relief.',
      price: 24.99,
      category: '1', // Essential Oils
      imageUrl: 'https://via.placeholder.com/300x300?text=Lavender+Oil',
    },
    {
      id: '2',
      name: 'Meditation Cushion Set',
      description: 'Comfortable cushion set for your meditation practice.',
      price: 49.99,
      category: '2', // Meditation
      imageUrl: 'https://via.placeholder.com/300x300?text=Meditation+Cushion',
    },
    {
      id: '3',
      name: 'Bamboo Water Bottle',
      description: 'Eco-friendly bamboo water bottle with crystal infuser.',
      price: 34.99,
      category: '2', // Meditation
      imageUrl: 'https://via.placeholder.com/300x300?text=Bamboo+Bottle',
    },
    {
      id: '4',
      name: 'Organic Herbal Tea',
      description: 'Blend of organic herbs for wellness and vitality.',
      price: 18.99,
      category: '1', // Essential Oils
      imageUrl: 'https://via.placeholder.com/300x300?text=Herbal+Tea',
    },
    {
      id: '5',
      name: 'Natural Face Serum',
      description: 'Rejuvenating serum with plant-based ingredients.',
      price: 39.99,
      category: '3', // Skincare
      imageUrl: 'https://via.placeholder.com/300x300?text=Face+Serum',
    },
    {
      id: '6',
      name: 'Rose Quartz Facial Roller',
      description: 'Facial massage tool to reduce puffiness and promote circulation.',
      price: 29.99,
      category: '3', // Skincare
      imageUrl: 'https://via.placeholder.com/300x300?text=Facial+Roller',
    },
    {
      id: '7',
      name: 'Peppermint Essential Oil',
      description: 'Refreshing peppermint oil for energy and focus.',
      price: 22.99,
      category: '1', // Essential Oils
      imageUrl: 'https://via.placeholder.com/300x300?text=Peppermint+Oil',
    },
    {
      id: '8',
      name: 'Yoga Mat Cork',
      description: 'Eco-friendly cork yoga mat with excellent grip.',
      price: 65.99,
      category: '2', // Meditation
      imageUrl: 'https://via.placeholder.com/300x300?text=Yoga+Mat',
    },
  ];

  // Filter products based on category and search query
  const filteredProducts = products.filter((product) => {
    const matchesCategory = categoryId ? product.category === categoryId : true;
    const matchesSearch = searchQuery 
      ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: '1', name: 'Essential Oils' },
    { id: '2', name: 'Meditation' },
    { id: '3', name: 'Skincare' },
  ];

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {categoryId
            ? `${categories.find(c => c.id === categoryId)?.name || 'Products'}`
            : searchQuery
            ? `Search results for "${searchQuery}"`
            : 'All Products'}
        </h1>
        <p className="text-gray-600">
          {filteredProducts.length} products found
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filter sidebar for desktop */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/products"
                  className={`block py-2 px-3 rounded-md transition-colors ${!categoryId ? 'bg-nature-light text-nature-dark font-medium' : 'hover:bg-gray-100'}`}
                >
                  All Products
                </Link>
              </li>
              {categories.map(category => (
                <li key={category.id}>
                  <Link
                    to={`/products?category=${category.id}`}
                    className={`block py-2 px-3 rounded-md transition-colors ${categoryId === category.id ? 'bg-nature-light text-nature-dark font-medium' : 'hover:bg-gray-100'}`}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t my-6"></div>

            <h2 className="text-lg font-semibold mb-4">Price Range</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <input id="price-all" type="radio" name="price" className="h-4 w-4 text-nature-dark focus:ring-nature-medium border-gray-300" defaultChecked />
                <label htmlFor="price-all" className="ml-2 text-gray-700">All Prices</label>
              </div>
              <div className="flex items-center">
                <input id="price-under-25" type="radio" name="price" className="h-4 w-4 text-nature-dark focus:ring-nature-medium border-gray-300" />
                <label htmlFor="price-under-25" className="ml-2 text-gray-700">Under $25</label>
              </div>
              <div className="flex items-center">
                <input id="price-25-50" type="radio" name="price" className="h-4 w-4 text-nature-dark focus:ring-nature-medium border-gray-300" />
                <label htmlFor="price-25-50" className="ml-2 text-gray-700">$25 - $50</label>
              </div>
              <div className="flex items-center">
                <input id="price-over-50" type="radio" name="price" className="h-4 w-4 text-nature-dark focus:ring-nature-medium border-gray-300" />
                <label htmlFor="price-over-50" className="ml-2 text-gray-700">Over $50</label>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile filter button and dropdown */}
        <div className="md:hidden mb-4">
          <button
            onClick={toggleFilter}
            className="w-full bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex justify-between items-center"
          >
            <span className="font-medium">Filters</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${isFilterOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isFilterOpen && (
            <div className="mt-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Categories</h2>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/products"
                    className={`block py-2 px-3 rounded-md transition-colors ${!categoryId ? 'bg-nature-light text-nature-dark font-medium' : 'hover:bg-gray-100'}`}
                  >
                    All Products
                  </Link>
                </li>
                {categories.map(category => (
                  <li key={category.id}>
                    <Link
                      to={`/products?category=${category.id}`}
                      className={`block py-2 px-3 rounded-md transition-colors ${categoryId === category.id ? 'bg-nature-light text-nature-dark font-medium' : 'hover:bg-gray-100'}`}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="border-t my-6"></div>

              <h2 className="text-lg font-semibold mb-4">Price Range</h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input id="m-price-all" type="radio" name="m-price" className="h-4 w-4 text-nature-dark focus:ring-nature-medium border-gray-300" defaultChecked />
                  <label htmlFor="m-price-all" className="ml-2 text-gray-700">All Prices</label>
                </div>
                <div className="flex items-center">
                  <input id="m-price-under-25" type="radio" name="m-price" className="h-4 w-4 text-nature-dark focus:ring-nature-medium border-gray-300" />
                  <label htmlFor="m-price-under-25" className="ml-2 text-gray-700">Under $25</label>
                </div>
                <div className="flex items-center">
                  <input id="m-price-25-50" type="radio" name="m-price" className="h-4 w-4 text-nature-dark focus:ring-nature-medium border-gray-300" />
                  <label htmlFor="m-price-25-50" className="ml-2 text-gray-700">$25 - $50</label>
                </div>
                <div className="flex items-center">
                  <input id="m-price-over-50" type="radio" name="m-price" className="h-4 w-4 text-nature-dark focus:ring-nature-medium border-gray-300" />
                  <label htmlFor="m-price-over-50" className="ml-2 text-gray-700">Over $50</label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? `We couldn't find any products matching "${searchQuery}".`
                  : 'No products available in this category.'}
              </p>
              <Link to="/products" className="btn btn-primary">View All Products</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <Link
                  to={`/products/${product.id}`}
                  key={product.id}
                  className="card group hover:border-nature-medium"
                >
                  <div className="relative mb-4 overflow-hidden rounded-lg">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-nature-dark transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                    <button className="btn btn-primary">Add to Cart</button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;