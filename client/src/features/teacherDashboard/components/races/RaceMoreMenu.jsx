import { MoreVertical } from "lucide-react";
import Button from "../../../../shared/components/ui/Button";
import { RACE_CARD_COMPACT_STYLES } from "../../styles/dashboardUiStyles";

export default function RaceMoreMenu({
                                         race,
                                         content,
                                         canEdit,
                                         canCancel,
                                         onEditRace,
                                         onCancelRace,
                                     }) {
    if (!canEdit && !canCancel) {
        return null;
    }

    function closeMenu(event) {
        event.currentTarget.closest("details")?.removeAttribute("open");
    }

    function handleEditRace(event) {
        closeMenu(event);
        onEditRace?.(race);
    }

    function handleCancelRace(event) {
        closeMenu(event);
        onCancelRace?.(race);
    }

    return (
        <details className="group relative">
            <summary
                aria-label={content.raceActions}
                className={RACE_CARD_COMPACT_STYLES.moreButton}
            >
                <MoreVertical size={20} aria-hidden="true" />
            </summary>

            <div className="absolute end-0 z-10 mt-2 min-w-36 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 text-sm font-bold shadow-xl">
                {canEdit && (
                    <Button
                        onClick={handleEditRace}
                        variant="ghost"
                        size="sm"
                        className="block w-full rounded-none text-start"
                    >
                        {content.edit}
                    </Button>
                )}

                {canCancel && (
                    <Button
                        onClick={handleCancelRace}
                        variant="danger"
                        size="sm"
                        className="block w-full rounded-none text-start"
                    >
                        {content.cancel}
                    </Button>
                )}
            </div>
        </details>
    );
}