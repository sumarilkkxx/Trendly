import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const inputClasses = [
  'px-4 py-2.5 rounded-lg min-h-[44px]',
  'bg-black/30 border border-white/10',
  'text-slate-200 placeholder-slate-500',
  'focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/20',
  'transition-colors duration-200',
].join(' ');

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(inputClasses, className)}
      {...props}
    />
  );
});
