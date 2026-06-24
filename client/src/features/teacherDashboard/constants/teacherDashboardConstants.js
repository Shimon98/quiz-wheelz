export const TEACHER_DASHBOARD_STATS = [
    {
        id: "total-races",
        contentKey: "totalRaces",
        iconName: "Flag",
        tone: "sky",
        value: 0,
    },
    {
        id: "active-races",
        contentKey: "activeRaces",
        iconName: "Gauge",
        tone: "emerald",
        value: 0,
    },
    {
        id: "finished-races",
        contentKey: "finishedRaces",
        iconName: "Trophy",
        tone: "violet",
        value: 0,
    },
    {
        id: "waiting-races",
        contentKey: "waitingRaces",
        iconName: "Timer",
        tone: "amber",
        value: 0,
    },
];

export const TEACHER_DASHBOARD_NAV_ACTIONS = Object.freeze({
    DASHBOARD: "dashboard",
    RACES: "races",
    CREATE_RACE: "createRace",
});

export const TEACHER_DASHBOARD_NAV_ITEMS = [
    {
        key: "dashboard",
        actionKey: TEACHER_DASHBOARD_NAV_ACTIONS.DASHBOARD,
        iconName: "Home",
    },
    {
        key: "races",
        actionKey: TEACHER_DASHBOARD_NAV_ACTIONS.RACES,
        iconName: "Flag",
    },
    {
        key: "createRace",
        actionKey: TEACHER_DASHBOARD_NAV_ACTIONS.CREATE_RACE,
        iconName: "Pencil",
    },
    {
        key: "students",
        iconName: "Users",
        isComingSoon: true,
    },
    {
        key: "subjects",
        iconName: "BookOpen",
        isComingSoon: true,
    },
    {
        key: "results",
        iconName: "Trophy",
        isComingSoon: true,
    },
    {
        key: "settings",
        iconName: "Settings",
        isComingSoon: true,
    },
];