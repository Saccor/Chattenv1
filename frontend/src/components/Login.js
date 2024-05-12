// src/components/Login.js
import React, { useState } from 'react';
import { loginUser } from '../services/api';

function Login() {
  const [loading, setLoading] = useState(false);
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
