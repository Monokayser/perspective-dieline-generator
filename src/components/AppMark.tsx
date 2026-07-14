type AppMarkProps = {
  size?: "compact" | "large";
};

export function AppMark({ size = "compact" }: AppMarkProps) {
  return (
    <span className={`app-mark${size === "large" ? " large" : ""}`} data-app-mark aria-hidden="true">
      <svg className="app-mark-svg" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false">
        <path className="app-mark-face app-mark-face-top" data-app-mark-face="top" d="M7.5 10.25 19.5 5.75 26 9.5 14.5 14.5Z" />
        <path className="app-mark-face app-mark-face-left" data-app-mark-face="left" d="M7.5 10.25 14.5 14.5 14.5 27 7.5 22.75Z" />
        <path className="app-mark-face app-mark-face-right" data-app-mark-face="right" d="M14.5 14.5 26 9.5 26 21.75 14.5 27Z" />
      </svg>
    </span>
  );
}
