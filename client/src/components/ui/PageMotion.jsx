import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function PageMotion({ children, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? false : { opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
