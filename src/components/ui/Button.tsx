import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

    const variantStyles = {
        primary: `
      bg-sus-blue hover:bg-sus-blue-dark
      text-white
      shadow-md hover:shadow-lg
      focus:ring-sus-blue
    `,
        secondary: `
      bg-white hover:bg-gray-50
      text-sus-blue border-2 border-sus-blue
      shadow-sm hover:shadow-md
      focus:ring-sus-blue
    `,
        success: `
      bg-sus-green hover:bg-sus-green-dark
      text-white
      shadow-md hover:shadow-lg
      focus:ring-green-500
    `,
        danger: `
      bg-red-500 hover:bg-red-600
      text-white
      shadow-md hover:shadow-lg
      focus:ring-red-500
    `,
        ghost: `
      bg-transparent hover:bg-gray-100
      text-gray-700
      focus:ring-gray-400
    `
    };

    const sizeStyles = {
        sm: 'px-3 py-2 text-sm min-h-[36px]',
        md: 'px-4 py-3 text-base min-h-[44px]',
        lg: 'px-6 py-4 text-lg min-h-[52px]'
    };

    return (
        <button
            className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Carregando...</span>
                </>
            ) : (
                <>
                    {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};
