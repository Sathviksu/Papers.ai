import React from 'react';

export const Button = React.forwardRef(({ variant = 'primary', size = 'default', className = '', children, asChild, ...props }, ref) => {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-[var(--radius-button)] focus:outline-none focus:ring-2 focus:ring-aurora-blue focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95 cursor-pointer";
  
  const variants = {
    primary: "bg-aurora-blue text-white hover:bg-indigo-700 shadow-md",
    gradient: "bg-gradient-to-r from-aurora-blue to-aurora-violet text-white hover:opacity-90 shadow-md",
    outline: "border border-aurora-border bg-transparent text-aurora-text-mid hover:bg-aurora-surface-1 hover:text-aurora-text-high",
    ghost: "bg-transparent text-aurora-text-mid hover:bg-aurora-surface-1 hover:text-aurora-text-high",
    danger: "bg-aurora-rose text-white hover:bg-rose-600 shadow-md",
    cyan: "bg-aurora-cyan text-white hover:bg-cyan-600 shadow-md",
  };
  
  const sizes = {
    default: "h-11 px-4 py-2",
    sm: "h-9 px-3 text-sm",
    lg: "h-14 px-8 text-lg",
    icon: "h-11 w-11",
    none: "",
  };

  const Comp = asChild ? React.cloneElement(children) : "button";
  
  if (asChild) {
    return React.cloneElement(children, {
      className: `${baseStyle} ${variants[variant]} ${sizes[size]} ${className} ${children.props.className || ''}`,
      ref,
      ...props
    });
  }

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} ref={ref} {...props}>
      {children}
    </button>
  );
});

Button.displayName = "Button";
