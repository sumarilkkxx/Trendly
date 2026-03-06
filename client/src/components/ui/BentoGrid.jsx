import { cn } from '@/lib/utils';

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
        'group relative overflow-hidden rounded-2xl border border-white/[0.06]',
        'transition-all duration-300 cursor-default',
        'bg-gradient-to-br from-white/[0.04] to-white/[0.01]',
        'hover:border-primary/20 hover:shadow-[0_0_30px_rgba(0,212,170,0.06)]',
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
          <div className="mb-3 text-primary/80 [&>svg]:size-6">{icon}</div>
        )}
        {title && (
          <h3 className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/80 mb-1">
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
