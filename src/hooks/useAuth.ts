import { useState, useEffect } from 'react';
import { User, AuthState } from '../types';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });
  const [error, setError] = useState('');

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('trustcart-user');
        const sessionExpiry = localStorage.getItem('trustcart-session-expiry');
        
        if (savedUser && sessionExpiry) {
          const expiryTime = parseInt(sessionExpiry);
          const currentTime = Date.now();
          
          if (currentTime < expiryTime) {
            const user = JSON.parse(savedUser);
            setAuthState({
              isAuthenticated: true,
              user,
              loading: false
            });
            return;
          } else {
            // Session expired
            localStorage.removeItem('trustcart-user');
            localStorage.removeItem('trustcart-session-expiry');
          }
        }
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setError('');
    setAuthState(prev => ({ ...prev, loading: true }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo credentials check
      if (email === 'demo@trustcart.lk' && password === 'demo123') {
        const user: User = {
          id: 'demo-user-1',
          email: 'demo@trustcart.lk',
          name: 'Demo User',
          company: 'Trustcart Demo',
          phone: '+94 77 123 4567',
          createdAt: new Date('2024-01-01'),
          lastLogin: new Date()
        };

        // Set session expiry (24 hours)
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        
        localStorage.setItem('trustcart-user', JSON.stringify(user));
        localStorage.setItem('trustcart-session-expiry', expiryTime.toString());

        setAuthState({
          isAuthenticated: true,
          user,
          loading: false
        });
        return;
      }

      // Check if user exists in localStorage (for registered users)
      const users = JSON.parse(localStorage.getItem('trustcart-users') || '[]');
      const existingUser = users.find((u: any) => u.email === email && u.password === password);

      if (existingUser) {
        const user: User = {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          company: existingUser.company,
          phone: existingUser.phone,
          createdAt: new Date(existingUser.createdAt),
          lastLogin: new Date()
        };

        // Update last login
        const updatedUsers = users.map((u: any) => 
          u.id === existingUser.id ? { ...u, lastLogin: new Date().toISOString() } : u
        );
        localStorage.setItem('trustcart-users', JSON.stringify(updatedUsers));

        // Set session
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('trustcart-user', JSON.stringify(user));
        localStorage.setItem('trustcart-session-expiry', expiryTime.toString());

        setAuthState({
          isAuthenticated: true,
          user,
          loading: false
        });
        return;
      }

      throw new Error('Invalid email or password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setAuthState(prev => ({ ...prev, loading: false }));
      throw err;
    }
  };

  const signup = async (userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
    phone?: string;
  }): Promise<void> => {
    setError('');
    setAuthState(prev => ({ ...prev, loading: true }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('trustcart-users') || '[]');
      const existingUser = users.find((u: any) => u.email === userData.email);

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const newUser = {
        id: `user-${Date.now()}`,
        email: userData.email,
        name: userData.name,
        company: userData.company,
        phone: userData.phone,
        password: userData.password, // In real app, this would be hashed
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Save to localStorage
      users.push(newUser);
      localStorage.setItem('trustcart-users', JSON.stringify(users));

      // Create user object for state
      const user: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        company: newUser.company,
        phone: newUser.phone,
        createdAt: new Date(newUser.createdAt),
        lastLogin: new Date(newUser.lastLogin)
      };

      // Set session
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      localStorage.setItem('trustcart-user', JSON.stringify(user));
      localStorage.setItem('trustcart-session-expiry', expiryTime.toString());

      setAuthState({
        isAuthenticated: true,
        user,
        loading: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
      setAuthState(prev => ({ ...prev, loading: false }));
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('trustcart-user');
    localStorage.removeItem('trustcart-session-expiry');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
    setError('');
  };

  return {
    ...authState,
    login,
    signup,
    logout,
    error,
    clearError: () => setError('')
  };
};