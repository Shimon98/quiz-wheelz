import { MAX_PLAYER_OPTIONS } from "../../config/createRaceFormConfig";

export default function MaxPlayersSelector({
    value,
    error,
    content,
    onChange,
}) {
    return (
        <fieldset>
            <legend className="text-sm font-extrabold text-slate-700">
                {content.fields.maxPlayers}
            </legend>

            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {MAX_PLAYER_OPTIONS.map((option) => {
                    const isSelected = Number(value) === option;

                    return (
                        <label
                            key={option}
                            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border text-sm font-extrabold transition ${
                                isSelected
                                    ? "border-sky-500 bg-sky-500 text-white shadow-md"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-sky-50"
                            }`}
                        >
                            <input
                                type="radio"
                                name="maxPlayers"
                                value={option}
                                checked={isSelected}
                                onChange={onChange}
                                className="sr-only"
                            />
                            {option}
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
