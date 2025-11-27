// Error Message Component
import React from 'react';
import { 
  FaExclamationTriangle, 
  FaTimesCircle, 
  FaWifi, 
  FaLock,
  FaTimes,
  FaRedo
} from 'react-icons/fa';

const ErrorMessage = ({ 
  error, 
  onRetry, 
  onDismiss 
}) => {
  // Format error message
  const getErrorMessage = () => {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return error.message;
    }
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    return 'An unexpected error occurred';
  };

  // Detect error type
  const getErrorType = () => {
    const message = getErrorMessage().toLowerCase();
    
    if (message.includes('network') || message.includes('connection') || error?.code === 'ERR_NETWORK') {
      return 'network';
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden') || error?.response?.status === 403) {
      return 'permission';
    }
    if (message.includes('server') || error?.response?.status >= 500) {
      return 'server';
    }
    return 'default';
  };

  const errorType = getErrorType();
  const errorMessage = getErrorMessage();

  // Error type configurations
  const errorConfig = {
    network: {
      icon: FaWifi,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-500',
      title: 'Connection Error'
    },
    validation: {
      icon: FaExclamationTriangle,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
      title: 'Validation Error'
    },
    permission: {
      icon: FaLock,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
      title: 'Permission Denied'
    },
    server: {
      icon: FaTimesCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
      title: 'Server Error'
    },
    default: {
      icon: FaExclamationTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
      title: 'Error'
    }
  };

  const config = errorConfig[errorType];
  const IconComponent = config.icon;

  return (
    <div 
      className={`
        ${config.bgColor} 
        ${config.borderColor} 
        border-l-4 
        rounded-lg 
        p-4 
        mb-4
        shadow-sm
        relative
      `}
      role="alert"
    >
      <div className="flex items-start">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
        </div>

        {/* Error Content */}
        <div className="ml-3 flex-1">
          {/* Error Title */}
          <h3 className={`text-sm font-semibold ${config.textColor} mb-1`}>
            {config.title}
          </h3>
          
          {/* Error Message */}
          <div className={`text-sm ${config.textColor}`}>
            {errorMessage}
          </div>

          {/* Action Buttons */}
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex items-center space-x-3">
              {/* Retry Button */}
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`
                    inline-flex items-center px-3 py-1.5
                    text-sm font-medium rounded-md
                    ${config.textColor}
                    bg-white
                    hover:bg-gray-50
                    border ${config.borderColor}
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    focus:ring-${config.color}-500
                  `}
                >
                  <FaRedo className="mr-2 h-3 w-3" />
                  Retry
                </button>
              )}

              {/* Dismiss Button (text) */}
              {onDismiss && !onRetry && (
                <button
                  onClick={onDismiss}
                  className={`
                    text-sm font-medium
                    ${config.textColor}
                    hover:underline
                    focus:outline-none
                  `}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss Icon Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`
              flex-shrink-0 ml-3
              ${config.iconColor}
              hover:${config.textColor}
              transition-colors
              focus:outline-none
            `}
            aria-label="Dismiss"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
