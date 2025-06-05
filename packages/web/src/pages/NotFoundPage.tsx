import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md text-center">
        <h1 className="text-9xl font-bold text-nature-dark">404</h1>
        <div className="mt-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
          <p className="text-gray-600">
            Sorry, we couldn't find the page you're looking for.
            It might have been moved or doesn't exist.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <Link
            to="/"
            className="btn btn-primary px-8 py-3"
          >
            Go Home
          </Link>
          <Link
            to="/products"
            className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;