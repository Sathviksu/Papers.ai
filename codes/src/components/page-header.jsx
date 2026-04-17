import { cn } from '@/lib/utils';

export function PageHeader({ title, description, className, children }) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row items-start md:items-center justify-between gap-4',
        className
      )}
    >
      <div className="grid gap-1 min-w-0 flex-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline break-words">
          {title}
        </h1>
        {description && <p className="text-muted-foreground break-words">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 gap-2 mb-auto">{children}</div>}
    </div>
  );
}
