import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function BentoCard({ children, className, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(
        'rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 transition-colors duration-200 hover:border-cyber-accent/30 hover:bg-white/[0.07]',
        className
      )}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { delay, duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
