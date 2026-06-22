import Button from "../../../../shared/components/ui/Button";
import EmptyState from "../../../../shared/components/ui/EmptyState";

export default function EmptyRacesState({
                                            message,
                                            createRaceLabel,
                                            onCreateRaceClick,
                                        }) {
    return (
        <EmptyState message={message}>
            {onCreateRaceClick && (
                <Button onClick={onCreateRaceClick}>
                    {createRaceLabel}
                </Button>
            )}
        </EmptyState>
    );
}