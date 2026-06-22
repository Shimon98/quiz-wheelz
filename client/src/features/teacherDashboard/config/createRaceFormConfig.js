export const MAX_PLAYER_OPTIONS = Object.freeze([2, 3, 4, 5, 6, 7, 8]);

export const RACE_LENGTH_OPTIONS = Object.freeze([
    {
        key: "short",
        contentKey: "short",
        totalDistance: 600,
    },
    {
        key: "regular",
        contentKey: "regular",
        totalDistance: 1000,
    },
    {
        key: "long",
        contentKey: "long",
        totalDistance: 1400,
    },
]);

export const CREATE_RACE_DEFAULT_VALUES = Object.freeze({
    title: "",
    subjectId: "",
    maxPlayers: 4,
    totalDistance: 1000,
});
