// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';


const RegisterPage = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('username', data.user.username);

                onRegisterSuccess(data.user);
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError(err.message || 'Connection error. Please try again.');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex mx-auto flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
            <Header />

            <div className="mx-auto max-w-md w-full bg-gray-800 rounded-lg shadow-2xl p-8 border-2 border-gray-700">
                <h2 className="mx-auto text-3xl font-bold text-white mb-2 text-center">
                    Create Account
                </h2>
                <p className="mx-auto text-gray-400 text-center mb-6">
                    Join the battle and start your journey
                </p>

                {error && (
                    <div className="mx-auto bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="mx-auto space-y-4">
                    <div>
                        <label className="mx-auto block text-gray-300 text-sm font-semibold mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username (min 3 characters)"
                            required
                            minLength={3}
                            maxLength={20}
                            className="mx-auto w-full px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                        <p className="mx-auto text-gray-500 text-xs mt-1">
                            3-20 characters, letters and numbers only
                        </p>
                    </div>

                    <div>
                        <label className="mx-auto block text-gray-300 text-sm font-semibold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password (min 6 characters)"
                            required
                            minLength={6}
                            className="wmx-auto -full px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mx-auto block text-gray-300 text-sm font-semibold mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                            minLength={6}
                            className="mx-auto w-full px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="success"
                        fullWidth
                        disabled={loading || !username.trim() || !password.trim() || !confirmPassword.trim()}
                    >
                        {loading ? '🔄 Creating account...' : '✨ Create Account'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        Already have an account?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                            Login here
                        </button>
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-gray-500 text-xs text-center">
                        🔒 Your password is encrypted and secure
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;