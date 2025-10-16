export default function MenuIcon({ size = 24 }) {
  return (
    <div className="menuButton">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        aria-hidden="true"
        focusable="false"
        // style={style}
      >
        <rect
          x="3"
          y="6"
          width="18"
          height="2"
          fill="currentColor"
          rx="0.95"
          ry="0.95"
        />
        <rect
          x="3"
          y="11"
          width="18"
          height="2"
          fill="currentColor"
          rx="0.95"
          ry="0.95"
        />
        <rect
          x="3"
          y="16"
          width="18"
          height="2"
          fill="currentColor"
          rx="0.95"
          ry="0.95"
        />
      </svg>
    </div>
  );
}
