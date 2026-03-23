"use client";

// LomboClaw logo: crustacean claw + lightning bolt
export function LogoIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Left pincer */}
      <path d="M3 4c0 3 2 5 4 6l2 1" />
      <path d="M3 4c2-1 4 0 5 2" />
      {/* Right pincer */}
      <path d="M21 4c0 3-2 5-4 6l-2 1" />
      <path d="M21 4c-2-1-4 0-5 2" />
      {/* Lightning bolt — filled, chunky */}
      <polygon points="14,6 10.5,12 13.5,12 10,18 11,18 14.5,11.5 11.5,11.5 14.5,6" fill="currentColor" stroke="none" />
      {/* Base/body */}
      <path d="M8 18c1 2 3 3 4 3s3-1 4-3" />
    </svg>
  );
}

// Boxed version for sidebar/header (with background)
export function LogoBox({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-emerald-600 ${className}`}
      style={{ width: size, height: size }}
    >
      <LogoIcon size={Math.round(size * 0.5)} className="text-white" />
    </div>
  );
}
