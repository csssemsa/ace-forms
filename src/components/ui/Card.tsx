import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    shadow?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    shadow = 'md',
    hover = false,
    onClick
}) => {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    const shadowStyles = {
        none: '',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg'
    };

    return (
        <div
            className={`
        bg-white
        rounded-lg
        border border-gray-200
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${hover ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
    return (
        <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
            {children}
        </div>
    );
};

export interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
    return (
        <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
            {children}
        </h3>
    );
};

export interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
    return <div className={className}>{children}</div>;
};

export interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
    return (
        <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
            {children}
        </div>
    );
};
