import EmptyState from "../../../../shared/components/ui/EmptyState";
import CreateRaceButton from "../createRace/CreateRaceButton";

export default function EmptyRacesState({
                                            message,
                                            createRaceLabel,
                                            onCreateRaceClick,
                                        }) {
    return (
        <EmptyState message={message}>
            {onCreateRaceClick && (
                <CreateRaceButton onClick={onCreateRaceClick}>
                    {createRaceLabel}
                </CreateRaceButton>
            )}
        </EmptyState>
    );
}