import Card from "../../../../shared/components/ui/Card";
import { cx } from "../../../../utils/classNameUtils";
import {
    TEACHER_STAT_CARD_STYLES,
    TEACHER_STAT_CARD_TONE_STYLES,
} from "../../styles/dashboardUiStyles.js";

const DEFAULT_TONE = "sky";

export default function TeacherStatCard({
                                            Icon,
                                            label,
                                            value,
                                            tone = DEFAULT_TONE,
                                        }) {
    const toneStyles =
        TEACHER_STAT_CARD_TONE_STYLES[tone] ??
        TEACHER_STAT_CARD_TONE_STYLES[DEFAULT_TONE];

    return (
        <Card
            as="article"
            padding="sm"
            className={cx(
                TEACHER_STAT_CARD_STYLES.card,
                toneStyles.card,
            )}
        >
            <span
                aria-hidden="true"
                className={cx(
                    TEACHER_STAT_CARD_STYLES.decorativeBlob,
                    toneStyles.decorativeBlob,
                )}
            />

            <svg
                aria-hidden="true"
                viewBox="0 0 80 32"
                className={cx(
                    TEACHER_STAT_CARD_STYLES.sparkline,
                    toneStyles.sparkline,
                )}
            >
                <path
                    d="M4 24 L18 18 L30 21 L44 10 L58 14 L74 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            <div className={TEACHER_STAT_CARD_STYLES.content}>
                <div className={TEACHER_STAT_CARD_STYLES.textBlock}>
                    <p className={TEACHER_STAT_CARD_STYLES.label}>
                        {label}
                    </p>

                    <p
                        className={cx(
                            TEACHER_STAT_CARD_STYLES.value,
                            toneStyles.value,
                        )}
                    >
                        {value}
                    </p>
                </div>

                {Icon && (
                    <span
                        aria-hidden="true"
                        className={cx(
                            TEACHER_STAT_CARD_STYLES.iconBox,
                            toneStyles.iconBox,
                        )}
                    >
                        <Icon className={TEACHER_STAT_CARD_STYLES.icon} />
                    </span>
                )}
            </div>
        </Card>
    );
}