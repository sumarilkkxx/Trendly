import { cn } from '@/lib/utils';

export function AuroraBackground({ className, children }) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 50% -15%, rgba(0, 212, 170, 0.10), transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 80%, rgba(99, 102, 241, 0.06), transparent 50%),
            radial-gradient(ellipse 70% 50% at 10% 70%, rgba(0, 212, 170, 0.05), transparent 50%)
          `,
        }}
      />
      <div className="absolute inset-0 -z-10 tech-grid opacity-40" />
      {children}
    </div>
  );
}
