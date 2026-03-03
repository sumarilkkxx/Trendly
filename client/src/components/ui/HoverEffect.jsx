import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function HoverEffect({ items, className }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {items.map((item, i) => (
        <motion.a
          key={item.id ?? i}
          href={item.link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block rounded-xl border border-white/10 bg-white/5 p-6 cursor-pointer transition-colors duration-200 hover:border-cyber-accent/50 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-cyber-accent/50 focus:ring-offset-2 focus:ring-offset-[#0a0e17]"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { delay: i * 0.05, duration: 0.3 }}
        >
          <h3 className="font-display font-semibold text-cyber-accent mb-2 line-clamp-2">
            {item.title}
          </h3>
          <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
          <span className="mt-2 inline-block text-xs text-cyber-accent/80 group-hover:text-cyber-accent transition-colors">
            {item.source} →
          </span>
        </motion.a>
      ))}
    </div>
  );
}
