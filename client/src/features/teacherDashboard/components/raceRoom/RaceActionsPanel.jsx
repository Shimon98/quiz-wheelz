import DashboardButton from "../ui/DashboardButton";
import {
    isRaceCancellable,
    isRaceEditable,
} from "../../utils/raceStatusUtils";

export default function RaceActionsPanel({
    race,
    content,
    onEditRace,
    onCancelRace,
}) {
    const canEdit = isRaceEditable(race.status);
    const canCancel = isRaceCancellable(race.status);

    return (
        <section className="rounded-3xl bg-white/85 p-6 text-start shadow-[0_10px_28px_rgba(27,42,65,0.08)]">
            <h2 className="text-xl font-extrabold text-slate-900">
                {content.actionsTitle}
            </h2>

            <div className="mt-5 grid gap-3">
                {canEdit && (
                    <DashboardButton
                        onClick={() => onEditRace?.(race)}
                        variant="secondary"
                    >
                        {content.editRace}
                    </DashboardButton>
                )}

                {canCancel && (
                    <DashboardButton
                        onClick={() => onCancelRace?.(race)}
                        variant="danger"
                    >
                        {content.cancelRace}
                    </DashboardButton>
                )}

                <DashboardButton disabled>
                    {content.startRace}
                </DashboardButton>
            </div>

            <p className="mt-3 text-xs font-bold text-slate-400">
                {content.startRaceDisabledHint}
            </p>
        </section>
    );
}
