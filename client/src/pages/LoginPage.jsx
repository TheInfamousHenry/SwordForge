// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

const LoginPage = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Login successful, storing user data:', data.user);
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user)); // Store complete user data
                onLogin(data.user);
                navigate('/home');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError(err.message || 'Connection error. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
            <Header />

            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-2xl p-8 border-2 border-gray-700">
                <h2 className="text-3xl font-bold text-white mb-2 text-center">
                    Welcome Back!
                </h2>
                <p className="text-gray-400 text-center mb-6">
                    Login to continue your adventure
                </p>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 text-sm font-semibold mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-semibold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        disabled={loading || !username.trim() || !password.trim()}
                    >
                        {loading ? '🔄 Logging in...' : '🎮 Login'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        Don't have an account?{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                            Register here
                        </button>
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-gray-500 text-xs text-center">
                        🔒 Your data is securely stored
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
