// Brand mark: two arrows mid-swap inside a rounded tile, plus the wordmark.
export function Logo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect width="40" height="40" rx="11" fill="var(--color-brand)" />
        <path
          d="M12 16h11l-3-3M28 24H17l3 3"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withText && (
        <span className="text-[1.05rem] font-extrabold tracking-tight text-ink">
          Swap<span className="text-brand">This</span>
        </span>
      )}
    </span>
  );
}
