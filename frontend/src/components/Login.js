import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, fetchCurrentUser } from '../services/api';

function Login() {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser().then(response => {
      if (response.isAuthenticated) {
        setIsAuthenticated(true);
      }
    }).catch(error => {
      console.error('Error fetching current user:', error);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await loginUser();
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login with Google'}
      </button>
    </div>
  );
}

export default Login;
