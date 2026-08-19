export function IconHome({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M3.5 10.5 12 4l8.5 6.5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V19a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V9.5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
    </svg>
  );
}

export function IconHoneyJar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M8 3.5h8" strokeWidth="1.7" strokeLinecap="round" stroke="currentColor" />
      <path d="M9 3.5v2.3l-2.3 2.4A3 3 0 0 0 6 10.2V19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8.8a3 3 0 0 0-.7-1.9L15 5.8V3.5" strokeWidth="1.7" strokeLinejoin="round" stroke="currentColor" />
      <path d="M6.3 13.5h11.4" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor" opacity=".6" />
      <path d="M11 13v5.2" strokeWidth="1.4" strokeLinecap="round" stroke="currentColor" opacity=".6" />
    </svg>
  );
}

export function IconCart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M3.5 4.5h2l1.6 10.2a2 2 0 0 0 2 1.7h7.6a2 2 0 0 0 2-1.6l1.2-6.4H6.2" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" />
      <circle cx="16.5" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function IconStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M12 3.5 14.4 9l6 .6-4.5 4 1.3 5.9L12 16.6 6.8 19.5l1.3-5.9-4.5-4 6-.6L12 3.5Z"
        strokeWidth="1.6" strokeLinejoin="round" stroke="currentColor"
      />
    </svg>
  );
}

export function IconMenu({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M4 7h16M4 12h16M4 17h11" strokeWidth="1.8" strokeLinecap="round" stroke="currentColor" />
    </svg>
  );
}

export function IconClose({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.8" strokeLinecap="round" stroke="currentColor" />
    </svg>
  );
}

export function IconDroplet({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M12 3.5c3 3.6 6 7.4 6 10.9a6 6 0 1 1-12 0c0-3.5 3-7.3 6-10.9Z"
        strokeWidth="1.7" strokeLinejoin="round" stroke="currentColor"
      />
    </svg>
  );
}
