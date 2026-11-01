import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 28,
  className = '',
  showText = false,
  onClick,
}) => {
  return (
    <div 
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* SVG Icon Mark */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 1024 1024" 
        className="shrink-0 overflow-visible"
        aria-label="Student IDE Logo"
      >
        <defs>
          <linearGradient id="logoMarkBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1e2e" />
            <stop offset="50%" stop-color="#181825" />
            <stop offset="100%" stop-color="#11111b" />
          </linearGradient>

          <linearGradient id="logoMarkBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#89b4fa" stop-opacity="0.9" />
            <stop offset="50%" stop-color="#b4befe" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#cba6f7" stop-opacity="0.9" />
          </linearGradient>

          <linearGradient id="logoMarkCap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#b4befe" />
            <stop offset="50%" stop-color="#89b4fa" />
            <stop offset="100%" stop-color="#7287fd" />
          </linearGradient>

          <linearGradient id="logoMarkLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#89dceb" />
            <stop offset="100%" stop-color="#89b4fa" />
          </linearGradient>

          <linearGradient id="logoMarkRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#b4befe" />
            <stop offset="100%" stop-color="#cba6f7" />
          </linearGradient>

          <linearGradient id="logoMarkSlash" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#a6e3a1" />
            <stop offset="50%" stop-color="#89dceb" />
            <stop offset="100%" stop-color="#89b4fa" />
          </linearGradient>

          <filter id="logoMarkShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.4" />
          </filter>
        </defs>

        {/* Base Squircle */}
        <rect 
          x="48" 
          y="48" 
          width="928" 
          height="928" 
          rx="220" 
          fill="url(#logoMarkBgGrad)" 
          stroke="url(#logoMarkBorder)" 
          strokeWidth="16" 
          filter="url(#logoMarkShadow)" 
        />

        {/* Cap Base */}
        <path d="M 370 330 L 370 395 C 370 455 654 455 654 395 L 654 330 Z" fill="#313244" opacity="0.9" />

        {/* Cap Rhombus Top */}
        <path d="M 512 180 L 784 285 L 512 390 L 240 285 Z" fill="url(#logoMarkCap)" />
        <path d="M 512 180 L 784 285 L 512 300 L 240 285 Z" fill="#ffffff" opacity="0.22" />

        {/* Tassel */}
        <circle cx="512" cy="285" r="22" fill="#ffffff" />
        <circle cx="512" cy="285" r="14" fill="#7287fd" />
        <path d="M 512 285 Q 670 295 730 350 Q 770 390 775 450" fill="none" stroke="#f9e2af" strokeWidth="14" strokeLinecap="round" />
        <circle cx="775" cy="450" r="14" fill="#f9e2af" />
        <path d="M 765 455 L 755 520 L 795 520 L 785 455 Z" fill="#f9e2af" />

        {/* Code Brackets & Slash */}
        <path d="M 400 500 L 290 600 L 400 700" fill="none" stroke="url(#logoMarkLeft)" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 624 500 L 734 600 L 624 700" fill="none" stroke="url(#logoMarkRight)" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 566 480 L 458 720" fill="none" stroke="url(#logoMarkSlash)" strokeWidth="56" strokeLinecap="round" />
        <circle cx="512" cy="790" r="18" fill="#89dceb" />
      </svg>

      {/* Optional Integrated Wordmark */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1 font-bold tracking-tight text-white text-sm">
            <span>Student</span>
            <span className="text-[#89b4fa]">IDE</span>
          </div>
          <span className="text-[9px] font-mono text-[#a6adc8] tracking-widest uppercase">
            V1 • Offline
          </span>
        </div>
      )}
    </div>
  );
};
