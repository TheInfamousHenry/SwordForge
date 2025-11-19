// src/components/layout/Header.jsx
import React from 'react';

const Header = () => {
    return (
        <div className="mb-8 text-center">
            <div className="inline-block">
                <div className="text-6xl mb-2">⚔️</div>
                <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
                    SwordForge
                </h1>
                <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            </div>
        </div>
    );
};

export default Header;