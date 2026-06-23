import Card from "../../../../shared/components/ui/Card";

const TEACHER_STAT_CARD_STYLES = Object.freeze({
    card:
        "min-h-[104px]",

    content:
        "flex items-start justify-between gap-3",

    textBlock:
        "min-w-0",

    label:
        "text-sm font-extrabold text-slate-500",

    value:
        "mt-2 text-3xl font-black leading-none text-slate-900",

    iconBox:
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600",

    icon:
        "h-5 w-5",
});

export default function TeacherStatCard({ Icon, label, value }) {
    return (
        <Card
            as="article"
            padding="sm"
            className={TEACHER_STAT_CARD_STYLES.card}
        >
            <div className={TEACHER_STAT_CARD_STYLES.content}>
                <div className={TEACHER_STAT_CARD_STYLES.textBlock}>
                    <p className={TEACHER_STAT_CARD_STYLES.label}>
                        {label}
                    </p>

                    <p className={TEACHER_STAT_CARD_STYLES.value}>
                        {value}
                    </p>
                </div>

                {Icon && (
                    <span
                        aria-hidden="true"
                        className={TEACHER_STAT_CARD_STYLES.iconBox}
                    >
                        <Icon className={TEACHER_STAT_CARD_STYLES.icon} />
                    </span>
                )}
            </div>
        </Card>
    );
}