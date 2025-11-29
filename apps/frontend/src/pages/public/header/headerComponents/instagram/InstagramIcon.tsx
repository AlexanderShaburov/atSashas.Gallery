// InstagramIcon.tsx
export function InstagramIcon({ size = 24, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* корпус камеры */}
      <rect x="3" y="3" width="18" height="18" rx="4" />
      {/* объектив */}
      <circle cx="12" cy="12" r="4" />
      {/* индикатор/вспышка */}
      <circle cx="17" cy="7" r="1" />
    </svg>
  );
}
