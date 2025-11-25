import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, children, noPadding = false, ...props }) => {
    return (
        <div
            className={cn(
                'bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden',
                className
            )}
            {...props}
        >
            <div className={cn(!noPadding && 'p-6')}>{children}</div>
        </div>
    );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    return (
        <div className={cn('px-6 py-4 border-b border-slate-100 bg-slate-50/50', className)} {...props}>
            {children}
        </div>
    );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => {
    return (
        <h3 className={cn('text-lg font-semibold text-slate-800', className)} {...props}>
            {children}
        </h3>
    );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    return (
        <div className={cn('p-6', className)} {...props}>
            {children}
        </div>
    );
};
