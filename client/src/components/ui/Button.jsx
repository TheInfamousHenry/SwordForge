// src/components/ui/Button.jsx
import React from 'react';

const Button = ({
                    children,
                    onClick,
                    variant = 'primary',
                    size = 'medium',
                    fullWidth = false,
                    disabled = false
                }) => {
    const baseClasses = 'font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/50',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/50',
        success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/50'
    };

    const sizeClasses = {
        small: 'px-4 py-2 text-sm',
        medium: 'px-6 py-3 text-base',
        large: 'px-8 py-4 text-lg'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass}`}
        >
            {children}
        </button>
    );
};

export default Button;