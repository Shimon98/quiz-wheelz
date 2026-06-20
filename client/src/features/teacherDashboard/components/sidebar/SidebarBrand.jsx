export default function SidebarBrand({ logoSrc, logoText }) {
    return (
        <div className="flex h-28 shrink-0 items-center justify-center overflow-hidden px-2">
            {logoSrc ? (
                <img
                    src={logoSrc}
                    alt={logoText}
                    className="max-h-24 max-w-[190px] object-contain"
                    draggable="false"
                />
            ) : (
                <div className="flex items-center gap-2 text-sky-700">
                    <span
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-lg"
                    >
                        🏁
                    </span>

                    <span className="text-lg font-extrabold">
                        {logoText}
                    </span>
                </div>
            )}
        </div>
    );
}