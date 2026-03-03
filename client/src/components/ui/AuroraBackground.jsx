import { cn } from '../../lib/utils';

export function AuroraBackground({ className, children, showRadialGradient = true }) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#0f1629_1px,transparent_1px),linear-gradient(to_bottom,#0f1629_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      <div
        className={cn(
          'absolute inset-0 h-full w-full',
          showRadialGradient &&
            '[mask-image:radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,212,170,0.3),transparent)]'
        )}
      />
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyber-accent/20 blur-[100px]" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />
      {children}
    </div>
  );
}
