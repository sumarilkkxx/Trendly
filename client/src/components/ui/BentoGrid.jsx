import { cn } from '@/lib/utils';

/**
 * Bento Grid - 科技风网格布局
 * 支持不同尺寸的卡片单元格
 */
export function BentoGrid({ className, children }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * BentoGridItem - 网格项，支持 size 控制占位
 * size: 'default' | 'tall' | 'wide' | 'large'
 */
export function BentoGridItem({
  className,
  size = 'default',
  title,
  description,
  header,
  icon,
  children,
  ...props
}) {
  const sizeClasses = {
    default: 'md:col-span-1 md:row-span-1',
    tall: 'md:col-span-1 md:row-span-2',
    wide: 'md:col-span-2 md:row-span-1',
    large: 'md:col-span-2 md:row-span-2',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]',
        'transition-all duration-300 hover:border-cyber-accent/30 hover:shadow-[0_0_24px_rgba(0,212,170,0.08)]',
        'hover:bg-white/[0.04]',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {header && (
        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
          {header}
        </div>
      )}
      <div className="relative flex flex-col h-full p-5">
        {icon && (
          <div className="mb-3 text-cyber-accent [&>svg]:size-6">{icon}</div>
        )}
        {title && (
          <h3 className="font-display font-semibold text-foreground mb-1">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground flex-1">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
