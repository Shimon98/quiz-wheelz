import { MAX_PLAYER_OPTIONS } from "../../config/createRaceFormConfig";

export default function MaxPlayersSelector({
                                               value,
                                               error,
                                               content,
                                               onChange,
                                           }) {
    return (
        <fieldset>
            <legend className="flex w-full items-center justify-end gap-2 text-sm font-extrabold text-slate-800">
                <span>{content.fields.maxPlayers}</span>
                <span aria-hidden="true">👥</span>
            </legend>

            <div
                dir="ltr"
                className="mt-3 grid grid-cols-7 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
            >
                {MAX_PLAYER_OPTIONS.map((option) => {
                    const isSelected = Number(value) === option;

                    return (
                        <label
                            key={option}
                            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl text-sm font-black transition ${
                                isSelected
                                    ? "bg-sky-500 text-white shadow-[0_8px_18px_rgba(14,165,233,0.35)]"
                                    : "text-slate-700 hover:bg-sky-50"
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