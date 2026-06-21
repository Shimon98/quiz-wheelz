import { RACE_LENGTH_OPTIONS } from "../../config/createRaceFormConfig";

const RACE_LENGTH_STYLES = {
    short: {
        icon: "⏱️",
        selected: "border-emerald-400 bg-emerald-50 text-emerald-700",
        iconBg: "bg-emerald-100",
    },
    regular: {
        icon: "🏆",
        selected: "border-sky-500 bg-sky-50 text-sky-700",
        iconBg: "bg-sky-100",
    },
    long: {
        icon: "🏁",
        selected: "border-violet-400 bg-violet-50 text-violet-700",
        iconBg: "bg-violet-100",
    },
};

function formatPoints(totalDistance, pointsTemplate) {
    return pointsTemplate.replace("{value}", totalDistance);
}

export default function RaceLengthSelector({
                                               value,
                                               error,
                                               content,
                                               onChange,
                                           }) {
    return (
        <fieldset>
            <legend className="flex w-full items-center justify-end gap-2 text-sm font-extrabold text-slate-800">
                <span>{content.fields.raceLength}</span>
                <span aria-hidden="true">🚩</span>
            </legend>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
                {RACE_LENGTH_OPTIONS.map((option) => {
                    const isSelected = Number(value) === option.totalDistance;
                    const style = RACE_LENGTH_STYLES[option.key] ?? RACE_LENGTH_STYLES.regular;

                    return (
                        <label
                            key={option.key}
                            className={`relative flex min-h-20 cursor-pointer items-center justify-center rounded-2xl border bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                                isSelected
                                    ? `${style.selected} shadow-[0_10px_24px_rgba(14,165,233,0.18)]`
                                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            <input
                                type="radio"
                                name="totalDistance"
                                value={option.totalDistance}
                                checked={isSelected}
                                onChange={onChange}
                                className="sr-only"
                            />

                            {isSelected && (
                                <span className="absolute -top-3 right-1/2 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full bg-sky-500 text-sm font-black text-white shadow-md">
                                    ✓
                                </span>
                            )}

                            <span className="grid gap-1">
                                <span
                                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-xl ${style.iconBg}`}
                                    aria-hidden="true"
                                >
                                    {style.icon}
                                </span>

                                <span className="text-sm font-black">
                                    {content.raceLengths[option.contentKey]}
                                </span>

                                <span className="text-xs font-extrabold text-slate-500">
                                    {formatPoints(
                                        option.totalDistance,
                                        content.raceLengths.points,
                                    )}
                                </span>
                            </span>
                        </label>
                    );
                })}
            </div>

            <p className="mt-2 min-h-5 text-xs font-bold text-rose-600">
                {error || "\u00A0"}
            </p>
        </fieldset>
    );
}