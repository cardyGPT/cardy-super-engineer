
import React from 'react';
import { Link } from 'react-router-dom';

export const CardyLogo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center">
      <img src="/lovable-uploads/9dc34b8b-96f1-4765-947e-ace7a4bd8a76.png" alt="Cardy Logo" className="h-8 w-8 mr-2" />
      <span className="text-xl font-bold">Cardy Super Engineer</span>
    </Link>
  );
};

export default CardyLogo;
