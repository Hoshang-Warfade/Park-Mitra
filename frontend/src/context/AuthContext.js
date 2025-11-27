// Authentication Context
import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

// Create Auth Context
export const AuthContext = createContext();

// Custom hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  // State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for token in localStorage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          // Parse stored user
          const parsedUser = JSON.parse(storedUser);

          // Verify token is still valid by making a request
          try {
            // Set token in axios defaults for verification
            const currentUser = await authService.getCurrentUser();
            
            // Token is valid, restore auth state
            setToken(storedToken);
            setUser(currentUser || parsedUser);
            setIsAuthenticated(true);
          } catch (error) {
            // Token is invalid or expired, clear storage
            console.error('Token validation failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (userData, authToken) => {
    try {
      // Set state
      setUser(userData);
      setToken(authToken);
      setIsAuthenticated(true);

      // Store in localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout service (if needed for backend cleanup)
      await authService.logout();
    } catch (error) {
      console.error('Logout service error:', error);
    } finally {
      // Clear state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login
      window.location.href = '/login';
    }
  };

  // Update user function
  const updateUser = (updatedUserData) => {
    try {
      // Merge updated data with existing user
      const updatedUser = { ...user, ...updatedUserData };

      // Update state
      setUser(updatedUser);

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error };
    }
  };

  // Context value
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
