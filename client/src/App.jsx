// src/App.jsx
import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import LobbyPage from './pages/LobbyPage';

function MultiplayerBattleGame(){
    const [currentPage, setCurrentPage] = useState('login'); // 'login', 'register', 'home', 'lobby', 'game'
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            const token = localStorage.getItem('authToken');
            if (savedUser && token) {
                console.log('👤 Restoring user from localStorage');
                return JSON.parse(savedUser);
            }
        } catch (error) {
            console.error('Error loading user from localStorage:', error);
        }
        return null;
    });

    const [isInGame, setIsInGame] = useState(false);
    const [playerName, setPlayerName] = useState('');

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        const userId = localStorage.getItem('userId');

        if (token && username && userId) {
            // Verify token with server (optional but recommended)
            setUser({ id: userId, username });
            setPlayerName(username);
            setCurrentPage('home');
        }
    }, []);

    // const handleLoginSuccess = (userData) => {
    //     setUser(userData);
    //     setPlayerName(userData.username);
    //     setCurrentPage('home');
    // };
    const handleLoginSuccess = (userData) => {
        console.log('👤 Setting user:', userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const handleRegisterSuccess = (userData) => {
        setUser(userData);
        setPlayerName(userData.username);
        setCurrentPage('home');
    };


    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        setUser(null);
        setPlayerName('');
        setCurrentPage('login');
    };

    const navigateTo = (page) => {
        setCurrentPage(page);
    };

    const renderPage = () => {
        // Authentication pages
        if (!user) {
            switch (currentPage) {
                case 'register':
                    return (
                        <RegisterPage
                            onRegisterSuccess={handleRegisterSuccess}
                            onSwitchToLogin={() => navigateTo('login')}
                        />
                    );
                case 'login':
                default:
                    return (
                        <LoginPage
                            onLoginSuccess={handleLoginSuccess}
                            onSwitchToRegister={() => navigateTo('register')}
                        />
                    );
            }
        }

        // Game pages (require authentication)
        switch (currentPage) {
            case 'home':
                return (
                    <HomePage
                        onStartGame={() => navigateTo('game')}
                        onJoinLobby={() => navigateTo('lobby')}
                        onLogout={handleLogout}
                        playerName={playerName}
                        setPlayerName={setPlayerName}
                        user={user}
                    />
                );
            case 'lobby':
                return (
                    <LobbyPage
                        onStartGame={() => navigateTo('game')}
                        onBack={() => navigateTo('home')}
                        playerName={playerName}
                        user={user}
                    />
                );
            case 'game':
                return (
                    <GamePage
                        onLeaveGame={() => navigateTo('home')}
                        playerName={playerName}
                        user={user}
                    />
                );
            default:
                return (
                    <HomePage
                        onStartGame={() => navigateTo('game')}
                        onJoinLobby={() => navigateTo('lobby')}
                        onLogout={handleLogout}
                        playerName={playerName}
                        setPlayerName={setPlayerName}
                        user={user}
                    />
                );
        }
    };

    return (
        <div className="mx-auto min-h-screen bg-gray-900">
            {renderPage()}
        </div>
    );
};

export default MultiplayerBattleGame;