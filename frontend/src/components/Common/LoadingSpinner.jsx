// Loading Spinner Component
import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = '', 
  fullScreen = false 
}) => {
  // Size classes for spinner
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-12 h-12 border-3',
    large: 'w-16 h-16 border-4'
  };

  // Size classes for container padding
  const containerPadding = {
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6'
  };

  // Message text size
  const messageSize = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  // Spinner element
  const spinner = (
    <div className="flex flex-col items-center justify-center">
      {/* Animated spinner */}
      <div
        className={`
          ${sizeClasses[size]}
          border-indigo-200
          border-t-indigo-600
          rounded-full
          animate-spin
        `}
        role="status"
        aria-label="Loading"
      />
      
      {/* Loading message */}
      {message && (
        <p className={`
          mt-4
          ${messageSize[size]}
          text-gray-700
          font-medium
          text-center
        `}>
          {message}
        </p>
      )}
    </div>
  );

  // Full screen overlay mode
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
        <div className="text-center">
          {spinner}
        </div>
      </div>
    );
  }

  // Inline mode
  return (
    <div className={`flex items-center justify-center ${containerPadding[size]}`}>
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
