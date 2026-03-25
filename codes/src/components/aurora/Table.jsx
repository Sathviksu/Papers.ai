import React from 'react';

export function Table({ className = '', children, ...props }) {
  return (
    <div className={`w-full overflow-auto rounded-[16px] border border-aurora-border shadow-sm ${className}`}>
      <table className="w-full caption-bottom text-sm text-aurora-text-mid" {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ className = '', children, ...props }) {
  return <thead className={`bg-gradient-to-r from-aurora-blue to-aurora-violet text-white ${className}`} {...props}>{children}</thead>
}

export function TableBody({ className = '', children, ...props }) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props}>{children}</tbody>
}

export function TableRow({ className = '', children, ...props }) {
  return (
    <tr
      className={`border-b border-aurora-border transition-colors even:bg-[rgba(67,97,238,0.03)] hover:bg-aurora-surface-3 hover:border-l-[3px] hover:border-l-aurora-blue data-[state=selected]:bg-aurora-surface-2 ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ className = '', children, ...props }) {
  return <th className={`h-12 px-4 text-left align-middle font-semibold text-white [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>{children}</th>
}

export function TableCell({ className = '', children, ...props }) {
  return <td className={`p-4 align-middle text-aurora-text-high [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>{children}</td>
}
