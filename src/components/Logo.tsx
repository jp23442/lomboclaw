"use client";

// LomboClaw logo — uses the Recraft-generated SVG
export function LogoIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="LomboClaw"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// Boxed version for sidebar/header (with rounded corners)
export function LogoBox({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="LomboClaw"
      width={size}
      height={size}
      className={`shrink-0 rounded-lg ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
