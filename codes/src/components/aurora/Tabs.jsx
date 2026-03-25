"use client";
import React, { useState } from 'react';

export function Tabs({ defaultValue, className = '', children, ...props }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <div className={className} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ className = '', children, activeTab, setActiveTab, ...props }) {
  return (
    <div className={`inline-flex items-center justify-center rounded-[12px] bg-aurora-surface-2 p-1 text-aurora-text-mid mb-4 ${className}`} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  )
}

export function TabsTrigger({ value, className = '', children, activeTab, setActiveTab, ...props }) {
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab && setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-[8px] px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-blue disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-white text-aurora-text-high shadow-sm' : 'hover:bg-aurora-surface-3 text-aurora-text-mid'} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className = '', children, activeTab, ...props }) {
  if (activeTab !== value) return null;
  return (
    <div
      className={`mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-blue animate-in fade-in zoom-in-95 duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
