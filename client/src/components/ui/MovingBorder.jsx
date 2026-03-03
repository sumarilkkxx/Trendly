import { cn } from '../../lib/utils';

export function MovingBorder({ children, className }) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-white/10 bg-white/5 p-5 transition-all duration-200 hover:border-cyber-accent/40 hover:shadow-[0_0_20px_rgba(0,212,170,0.1)]',
        className
      )}
    >
      {children}
    </div>
  );
}
