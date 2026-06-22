import Card from "../../../../shared/components/ui/Card";

const TEACHER_STAT_CARD_STYLES = Object.freeze({
    content:
        "flex items-center gap-3",

    iconBox:
        "flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50",

    icon:
        "h-5 w-5 object-contain",

    label:
        "text-sm font-semibold text-slate-500",

    value:
        "mt-4 text-4xl font-bold text-slate-900",
});

export default function TeacherStatCard({ icon, label, value }) {
    return (
        <Card as="article">
            <div className={TEACHER_STAT_CARD_STYLES.content}>
                <span
                    aria-hidden="true"
                    className={TEACHER_STAT_CARD_STYLES.iconBox}
                >
                    {icon && (
                        <img
                            src={icon}
                            alt=""
                            className={TEACHER_STAT_CARD_STYLES.icon}
                        />
                    )}
                </span>

                <p className={TEACHER_STAT_CARD_STYLES.label}>
                    {label}
                </p>
            </div>

            <p className={TEACHER_STAT_CARD_STYLES.value}>
                {value}
            </p>
        </Card>
    );
}