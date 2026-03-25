export function Badge({ variant = 'default', className = '', children, ...props }) {
  const baseStyle = "inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-badge)] text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-aurora-blue focus:ring-offset-2";
  
  const variants = {
    default: "bg-aurora-surface-1 text-aurora-blue border border-aurora-blue/20",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-rose-50 text-aurora-rose border border-rose-200",
    outline: "text-aurora-text-mid border border-aurora-border",
    neutral: "bg-aurora-surface-2 text-aurora-text-mid",
  };
  
  return (
    <div className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
