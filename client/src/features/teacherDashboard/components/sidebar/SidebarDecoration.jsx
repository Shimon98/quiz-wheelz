export default function SidebarDecoration({ imageSrc }) {
    if (!imageSrc) {
        return null;
    }

    return (
        <img
            src={imageSrc}
            alt=""
            aria-hidden="true"
            className="mt-auto max-h-32 w-full shrink-0 border-t border-sky-100 object-contain pt-4 opacity-90"
        />
    );
}