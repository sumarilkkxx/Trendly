import { cn } from '@/lib/utils';

/**
 * Aurora / 极光背景 - 赛博风格渐变背景
 * 适用于 Dashboard 等页面的氛围营造
 */
export function AuroraBackground({ className, children }) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 50% -15%, rgba(0, 212, 170, 0.12), transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 80%, rgba(99, 102, 241, 0.08), transparent 50%),
            radial-gradient(ellipse 70% 50% at 10% 70%, rgba(0, 212, 170, 0.06), transparent 50%)
          `,
        }}
      />
      {/* 细网格叠加 */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 170, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 170, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {children}
    </div>
  );
}
