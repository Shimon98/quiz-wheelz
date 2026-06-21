import { RACE_LENGTH_OPTIONS } from "../../config/createRaceFormConfig";

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
            <legend className="text-sm font-extrabold text-slate-700">
                {content.fields.raceLength}
            </legend>

            <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {RACE_LENGTH_OPTIONS.map((option) => {
                    const isSelected = Number(value) === option.totalDistance;

                    return (
                        <label
                            key={option.key}
                            className={`cursor-pointer rounded-2xl border p-4 transition ${
                                isSelected
                                    ? "border-sky-500 bg-sky-50 shadow-md"
                                    : "border-slate-200 bg-white hover:bg-slate-50"
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

                            <span className="block text-sm font-extrabold text-slate-800">
                                {content.raceLengths[option.contentKey]}
                            </span>
                            <span className="mt-1 block text-xs font-bold text-slate-500">
                                {formatPoints(
                                    option.totalDistance,
                                    content.raceLengths.points,
                                )}
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
