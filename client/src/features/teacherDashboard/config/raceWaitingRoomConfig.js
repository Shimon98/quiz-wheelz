export const WAITING_ROOM_INFO_CARD_KEYS = Object.freeze({
    SUBJECT: "subject",
    MAX_PLAYERS: "maxPlayers",
    JOINED_PLAYERS: "joinedPlayers",

});
export const WAITING_ROOM_DEFAULT_MAX_PLAYERS = 0;

export const WAITING_ROOM_INFO_CARD_ITEMS = Object.freeze([
    {
        key: WAITING_ROOM_INFO_CARD_KEYS.SUBJECT,
        contentKey: "subject",
        valueField: "subject",
    },
    {
        key: WAITING_ROOM_INFO_CARD_KEYS.MAX_PLAYERS,
        contentKey: "maxPlayers",
        valueField: "maxPlayers",
    },
    {
        key: WAITING_ROOM_INFO_CARD_KEYS.JOINED_PLAYERS,
        contentKey: "joinedPlayers",
        valueField: "joinedPlayers",
    },
]);


export const WAITING_ROOM_ACTION_KEYS = Object.freeze({
    COPY_CODE: "copyCode",
    SHARE_LINK: "shareLink",
    EDIT_RACE: "editRace",
    START_RACE: "startRace",
});

export const WAITING_ROOM_SETTINGS_KEYS = Object.freeze({
    RACE_TYPE: "raceType",
    WIN_CONDITION: "winCondition",
    QUESTION_TIME: "questionTime",
    TRACK_LENGTH: "trackLength",
    QUESTION_ORDER: "questionOrder",
});

export const WAITING_ROOM_QUICK_ACTION_KEYS = Object.freeze({
    CANCEL_RACE: "cancelRace",
});

export const WAITING_ROOM_QUICK_ACTION_ITEMS = Object.freeze([
    {
        key: WAITING_ROOM_QUICK_ACTION_KEYS.CANCEL_RACE,
        contentKey: "cancelRace",
        actionType: "cancel",
        variant: "danger",
        disabled: false,
    },
]);

export const WAITING_ROOM_VEHICLE_ASSET_KEYS = Object.freeze([
    "greenCar",
    "yellowCar",
    "blueCar",
    "redCar",
    "purpleCar",
    "orangeCar",
    "cyanCar",
    "pinkCar",
]);

export const WAITING_ROOM_DEFAULT_VEHICLE_ASSET_KEY = "defaultCar";


export const WAITING_ROOM_SETTINGS_ITEMS = Object.freeze([
    {
        key: WAITING_ROOM_SETTINGS_KEYS.RACE_TYPE,
        contentKey: "raceType",
        valueType: "contentValue",
    },
    {
        key: WAITING_ROOM_SETTINGS_KEYS.WIN_CONDITION,
        contentKey: "winCondition",
        valueType: "contentValue",
    },
    {
        key: WAITING_ROOM_SETTINGS_KEYS.QUESTION_TIME,
        contentKey: "questionTime",
        valueType: "contentValue",
    },
    {
        key: WAITING_ROOM_SETTINGS_KEYS.TRACK_LENGTH,
        contentKey: "trackLength",
        valueType: "raceDistance",
    },
    {
        key: WAITING_ROOM_SETTINGS_KEYS.QUESTION_ORDER,
        contentKey: "questionOrder",
        valueType: "contentValue",
    },
]);

export const WAITING_ROOM_SLOT_COLORS = Object.freeze([
    "bg-emerald-500",
    "bg-amber-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-rose-400",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-slate-400",
]);

export const WAITING_ROOM_DEFAULT_SETTINGS = Object.freeze({
    raceType: "classic",
    winCondition: "firstToFinish",
    questionTime: "adaptive",
    questionOrder: "random",
});