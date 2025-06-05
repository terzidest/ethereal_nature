import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Mock product data 
  const product = {
    id: productId,
    name: 'Lavender Essential Oil',
    description: 'Our pure lavender essential oil is carefully distilled from fresh lavender flowers. Known for its calming and relaxing properties, it\'s perfect for aromatherapy, skincare, and promoting restful sleep.',
    price: 24.99,
    category: 'Essential Oils',
    rating: 4.8,
    reviewCount: 124,
    stock: 15,
    imageUrls: [
      'https://via.placeholder.com/600x600?text=Lavender+Oil+1',
      'https://via.placeholder.com/600x600?text=Lavender+Oil+2',
      'https://via.placeholder.com/600x600?text=Lavender+Oil+3',
    ],
    details: [
      'Volume: 15ml',
      '100% Pure & Natural',
      'Sustainably Sourced',
      'No Synthetic Additives',
      'Cold-Pressed Extraction',
    ],
    usage: [
      'Add a few drops to your diffuser for a calming atmosphere',
      'Mix with carrier oil for a relaxing massage',
      'Add to bathwater for a soothing experience',
      'Use in DIY skincare recipes',
    ]
  };

  // Mock related products
  const relatedProducts = [
    {
      id: '7',
      name: 'Peppermint Essential Oil',
      price: 22.99,
      imageUrl: 'https://via.placeholder.com/300x300?text=Peppermint+Oil',
    },
    {
      id: '9',
      name: 'Eucalyptus Essential Oil',
      price: 26.99,
      imageUrl: 'https://via.placeholder.com/300x300?text=Eucalyptus+Oil',
    },
    {
      id: '10',
      name: 'Tea Tree Essential Oil',
      price: 19.99,
      imageUrl: 'https://via.placeholder.com/300x300?text=Tea+Tree+Oil',
    },
  ];

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = () => {
    // dummy add to cart 
    toast.success(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart!`);
  };

  const handleBuyNow = () => {
    // add to cart and navigate to checkout
    toast.success(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart!`);
    navigate('/checkout');
  };

  // If product not found 
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8 text-sm">
        <Link to="/" className="text-gray-500 hover:text-nature-dark">Home</Link>
        <span className="mx-2 text-gray-500">/</span>
        <Link to="/products" className="text-gray-500 hover:text-nature-dark">Products</Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 p-6">
          {/* Product Images */}
          <div>
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={product.imageUrls[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.imageUrls.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-nature-dark' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400 mr-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'fill-current' : 'stroke-current fill-none'}`}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            <div className="text-3xl font-bold mb-6">${product.price.toFixed(2)}</div>

            <p className="text-gray-700 mb-6">{product.description}</p>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Quantity</h3>
              <div className="flex">
                <button
                  onClick={decrementQuantity}
                  className="bg-gray-100 px-3 py-2 rounded-l-md hover:bg-gray-200 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-16 border-y border-gray-300 py-2 text-center focus:outline-none"
                />
                <button
                  onClick={incrementQuantity}
                  className="bg-gray-100 px-3 py-2 rounded-r-md hover:bg-gray-200 transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">{product.stock} items available</p>
            </div>

            <div className="flex space-x-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="btn btn-primary flex-1 py-3"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="btn btn-secondary flex-1 py-3"
              >
                Buy Now
              </button>
            </div>

            {/* Product Details */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold mb-3">Product Details</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {product.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Suggestions */}
        <div className="border-t border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4">How to Use</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {product.usage.map((usage, index) => (
              <li key={index}>{usage}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {relatedProducts.map(relatedProduct => (
            <Link
              to={`/products/${relatedProduct.id}`}
              key={relatedProduct.id}
              className="card group hover:border-nature-medium"
            >
              <div className="relative mb-4 overflow-hidden rounded-lg">
                <img
                  src={relatedProduct.imageUrl}
                  alt={relatedProduct.name}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-nature-dark transition-colors">
                {relatedProduct.name}
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">${relatedProduct.price.toFixed(2)}</span>
                <button className="btn btn-primary">Add to Cart</button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;