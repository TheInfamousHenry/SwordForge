// src/components/layout/Footer.jsx
import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-gray-800 border-t border-gray-700 py-6 mt-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                    {/* About */}
                    <div>
                        <h3 className="text-white font-bold mb-2">⚔️ SwordForge</h3>
                        <p className="text-gray-400 text-sm">
                            Multiplayer battle arena built with React, Phaser, and Socket.io
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-white font-bold mb-2">Quick Links</h3>
                        <ul className="text-gray-400 text-sm space-y-1">
                            <li>
                                <a href="#" className="hover:text-blue-400 transition-colors">
                                    📖 How to Play
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-blue-400 transition-colors">
                                    🏆 Leaderboard
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-blue-400 transition-colors">
                                    📊 Stats
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Tech Stack */}
                    <div>
                        <h3 className="text-white font-bold mb-2">Built With</h3>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">React, </span>
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">Phaser, </span>
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">Node.js, </span>
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"> and Socket.io</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                        <p>© {currentYear} SwordForge. All rights reserved.</p>
                        <p className="mt-2 md:mt-0">
                            Made with ❤️ by{' '}
                            <a
                                href="https://github.com/TheInfamousHenry"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                 itHuRTZ
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;