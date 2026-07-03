// Covelligent SVG Logo — Geometric "C" intelligence mark with neural lattice
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Covelligent logo"
      className={className}
    >
      {/* Outer rounded square — deep indigo */}
      <rect width="40" height="40" rx="9" fill="hsl(243, 75%, 59%)" />
      {/* Bold C arc — primary mark */}
      <path
        d="M28 13.5 C24.5 10.5 16 10 12 16 C9 20 9 26 13 30 C17 34 24 33.5 28 30.5"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Intelligence dot cluster — top right */}
      <circle cx="28.5" cy="13" r="2" fill="hsl(195, 90%, 65%)" />
      <circle cx="28.5" cy="31" r="2" fill="hsl(195, 90%, 65%)" />
      {/* Subtle connector spine */}
      <path
        d="M28.5 15 L28.5 29"
        stroke="hsl(195, 90%, 65%)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 2.5"
        opacity="0.7"
      />
    </svg>
  );
}

export function LogoWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo size={30} />
      <span className="font-display font-bold text-lg tracking-[-0.02em]">
        Covelligent
      </span>
    </div>
  );
}
