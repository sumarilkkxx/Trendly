import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const base = [
  'px-5 py-2.5 rounded-lg min-h-[44px]',
  'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30',
  'hover:bg-cyber-accent/30',
  'transition-colors duration-200',
  'cursor-pointer font-medium text-sm',
  'focus:outline-none focus:ring-2 focus:ring-cyber-accent/50 focus:ring-offset-2 focus:ring-offset-[#0a0e17]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

const secondary = [
  'bg-white/5 border-white/10 text-slate-300',
  'hover:bg-white/10 hover:border-white/20',
].join(' ');

export function Button({ children, variant = 'primary', className, ...props }) {
  return (
    <motion.button
      type="button"
      className={cn(base, variant === 'secondary' && secondary, className)}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
