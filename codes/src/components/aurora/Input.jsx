import React from 'react';

export const Input = React.forwardRef(({ className = '', type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-11 w-full rounded-[var(--radius-input)] border border-aurora-border bg-white px-3 py-2 text-sm text-aurora-text-high ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-aurora-text-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input";
