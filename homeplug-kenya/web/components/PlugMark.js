export default function PlugMark({ className = 'plug-mark' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="13" cy="13" r="12" stroke="var(--accent)" strokeWidth="1.4" opacity="0.35" />
      <path
        d="M9 8v3.2M17 8v3.2"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8 11.2h10v2.3c0 2.7-2.2 4.9-5 4.9s-5-2.2-5-4.9v-2.3Z"
        fill="var(--accent)"
        opacity="0.9"
      />
      <path d="M13 19v2.4" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
