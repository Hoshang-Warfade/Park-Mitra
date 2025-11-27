import React, { Component } from 'react';
import './ErrorBoundary.css';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree
 * Logs errors and displays fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state to show fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Optional: Send to error tracking service (Sentry, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   logErrorToService(error, errorInfo);
    // }
  }

  handleReset = () => {
    // Reset error state and reload
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>Oops! Something went wrong</h1>
            <p>We're sorry for the inconvenience. The application encountered an error.</p>
            
            {this.state.error && (
              <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '10px' }}>
                  Error Details
                </summary>
                <div style={{ 
                  background: '#f3f4f6', 
                  padding: '16px', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  <p><strong>Error:</strong> {this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <p style={{ marginTop: '10px' }}>
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </p>
                  )}
                </div>
              </details>
            )}
            
            <div className="error-actions">
              <button className="btn-primary" onClick={this.handleReset}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                </svg>
                Reload Application
              </button>
              <button className="btn-secondary" onClick={this.handleGoBack}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
