import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 transition-all duration-200',
        hover && 'hover:shadow-card-hover hover:border-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
