import React from 'react';

export default function EnlargeIcon({ size = 16, color = '#6b7280', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="3" y="3" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <rect x="11" y="11" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <path d="M9 5h2M5 9v2M15 11v-2M11 15h-2" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
