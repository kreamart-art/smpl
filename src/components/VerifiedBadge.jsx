// Admin-granted verified mark — a small ink square with a white checkmark,
// on-brand with the monochrome / no-rounded aesthetic.
export default function VerifiedBadge({ size = 16, className = '', title = 'Verified' }) {
  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex shrink-0 items-center justify-center bg-ink text-bg ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={Math.round(size * 0.64)}
        height={Math.round(size * 0.64)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  )
}
