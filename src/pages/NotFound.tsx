
import React from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-7xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Oops! Page not found</p>
        <Link 
          to="/" 
          className="text-blue-500 hover:text-blue-700 transition-colors text-lg"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
