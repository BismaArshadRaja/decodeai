import React from 'react';

export const BrandIcon = ({
  size = 'md',
  className = '',
  animate = true,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-3xl',
    xl: 'w-20 h-20 rounded-3xl',
  };

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 32,
    xl: 42,
  };

  const px = iconSizes[size] || 24;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 group ${className}`}>
      {/* Outer ambient glow */}
      <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 rounded-2xl sm:rounded-3xl blur-md opacity-60 group-hover:opacity-90 transition duration-500" />

      {/* Main container */}
      <div
        className={`relative ${sizeMap[size] || sizeMap.md} bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-950 flex items-center justify-center border border-emerald-400/40 shadow-xl overflow-hidden`}
      >
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(52, 211, 153, 0.4) 1px, transparent 0)',
            backgroundSize: '8px 8px',
          }}
        />

        {/* Vector SVG Emblem: Document + Audio Soundwave + Intelligent AI Spark */}
        <svg
          width={px}
          height={px}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="docGrad" x1="8" y1="6" x2="36" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399" />
              <stop offset="0.5" stopColor="#10B981" />
              <stop offset="1" stopColor="#065F46" />
            </linearGradient>
            <linearGradient id="waveGrad" x1="18" y1="20" x2="40" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#2DD4BF" />
            </linearGradient>
            <linearGradient id="sparkGrad" x1="30" y1="6" x2="44" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          {/* Document Sheet with folded corner */}
          <path
            d="M10 9C10 6.79086 11.7909 5 14 5H27L37 15V39C37 41.2091 35.2091 43 33 43H14C11.7909 43 10 41.2091 10 39V9Z"
            fill="url(#docGrad)"
            fillOpacity="0.22"
            stroke="#34D399"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Document folded corner tab */}
          <path
            d="M27 5V13C27 14.1046 27.8954 15 29 15H37"
            stroke="#6EE7B7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Text Line 1 */}
          <line
            x1="15"
            y1="14"
            x2="22"
            y2="14"
            stroke="#A7F3D0"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Dynamic Audio Waves radiating from document center */}
          <rect x="15" y="24" width="2.5" height="10" rx="1.25" fill="url(#waveGrad)">
            {animate && (
              <animate
                attributeName="height"
                values="10;14;6;12;10"
                dur="1.8s"
                repeatCount="indefinite"
              />
            )}
          </rect>
          <rect x="20" y="20" width="2.5" height="18" rx="1.25" fill="#38BDF8">
            {animate && (
              <animate
                attributeName="height"
                values="18;10;20;14;18"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </rect>
          <rect x="25" y="22" width="2.5" height="14" rx="1.25" fill="#34D399">
            {animate && (
              <animate
                attributeName="height"
                values="14;20;8;16;14"
                dur="1.7s"
                repeatCount="indefinite"
              />
            )}
          </rect>
          <rect x="30" y="26" width="2.5" height="8" rx="1.25" fill="#2DD4BF">
            {animate && (
              <animate
                attributeName="height"
                values="8;16;10;6;8"
                dur="1.4s"
                repeatCount="indefinite"
              />
            )}
          </rect>

          {/* Glowing AI Star on top right */}
          <path
            d="M38 7L39.2 10.8L43 12L39.2 13.2L38 17L36.8 13.2L33 12L36.8 10.8L38 7Z"
            fill="url(#sparkGrad)"
          />
        </svg>

        {/* Live status dot */}
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
      </div>
    </div>
  );
};
