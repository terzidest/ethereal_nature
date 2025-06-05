import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  // Mock featured products
  const featuredProducts = [
    {
      id: '1',
      name: 'Lavender Essential Oil',
      description: 'Pure lavender essential oil for relaxation and stress relief.',
      price: 24.99,
      imageUrl: 'https://via.placeholder.com/300x300?text=Lavender+Oil',
    },
    {
      id: '2',
      name: 'Meditation Cushion Set',
      description: 'Comfortable cushion set for your meditation practice.',
      price: 49.99,
      imageUrl: 'https://via.placeholder.com/300x300?text=Meditation+Cushion',
    },
    {
      id: '3',
      name: 'Bamboo Water Bottle',
      description: 'Eco-friendly bamboo water bottle with crystal infuser.',
      price: 34.99,
      imageUrl: 'https://via.placeholder.com/300x300?text=Bamboo+Bottle',
    },
    {
      id: '4',
      name: 'Organic Herbal Tea',
      description: 'Blend of organic herbs for wellness and vitality.',
      price: 18.99,
      imageUrl: 'https://via.placeholder.com/300x300?text=Herbal+Tea',
    },
  ];

  // Mock categories
  const categories = [
    {
      id: '1',
      name: 'Essential Oils',
      imageUrl: 'https://via.placeholder.com/500x300?text=Essential+Oils',
    },
    {
      id: '2',
      name: 'Meditation',
      imageUrl: 'https://via.placeholder.com/500x300?text=Meditation',
    },
    {
      id: '3',
      name: 'Skincare',
      imageUrl: 'https://via.placeholder.com/500x300?text=Skincare',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-cover bg-center py-32 bg-nature-light">
        <div className="absolute inset-0 bg-opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-nature-medium mb-6 text-shadow">
            Connect with Nature's Essence
          </h1>
          <p className="text-xl text-nature-medium mb-8 max-w-3xl mx-auto">
            Discover our collection of natural wellness products designed to nurture your body, mind, and spirit.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/products" className="btn bg-nature-medium text-white hover:bg-nature-dark px-8 py-3 text-lg">
              Shop Now
            </Link>
            <Link to="/about" className="btn bg-white text-nature-medium hover:bg-gray-100 focus:ring-white px-8 py-3 text-lg">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Explore Our Categories</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                to={`/products?category=${category.id}`}
                key={category.id}
                className="group relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 transform hover:-translate-y-2"
              >
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                  <span className="inline-block text-white bg-nature-dark px-4 py-2 rounded-full text-sm transition-colors duration-300 group-hover:bg-nature-accent group-hover:text-gray-900">
                    Shop Now
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
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
                  <div className="absolute top-2 right-2 bg-nature-accent text-gray-900 text-sm font-medium px-3 py-1 rounded-full">
                    Featured
                  </div>
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
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="btn btn-secondary px-8 py-3"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-nature-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="card text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "The products from Ethereal Nature have transformed my daily wellness routine. The quality is exceptional and I love the sustainable packaging!"
                </p>
                <p className="font-medium">— Customer Name</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-nature-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter to receive updates on new products, special offers, and wellness tips.
          </p>
          <form className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Your email address"
              className="px-4 py-3 w-full rounded-l-md focus:outline-none text-gray-900"
            />
            <button
              type="submit"
              className="bg-nature-accent text-gray-900 px-6 py-3 rounded-r-md hover:bg-opacity-90 transition-colors font-medium"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;