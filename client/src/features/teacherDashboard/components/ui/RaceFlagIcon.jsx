export default function RaceFlagIcon({
                                         className = "h-5 w-5",
                                         ...props
                                     }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <path
                d="M5 4v16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />

            <rect x="7" y="4" width="3" height="3" fill="currentColor" />
            <rect x="13" y="4" width="3" height="3" fill="currentColor" />

            <rect x="10" y="7" width="3" height="3" fill="currentColor" />
            <rect x="16" y="7" width="3" height="3" fill="currentColor" />

            <rect x="7" y="10" width="3" height="3" fill="currentColor" />
            <rect x="13" y="10" width="3" height="3" fill="currentColor" />

            <rect x="10" y="13" width="3" height="3" fill="currentColor" />
            <rect x="16" y="13" width="3" height="3" fill="currentColor" />

            <path
                d="M7 4h12v12H7z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}