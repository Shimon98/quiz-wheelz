export function buildCreateRacePayload(formValues) {
    return {
        title: formValues.title?.trim() ?? "",
        subjectId: Number(formValues.subjectId),
        maxPlayers: Number(formValues.maxPlayers),
        totalDistance: Number(formValues.totalDistance),
    };
}
