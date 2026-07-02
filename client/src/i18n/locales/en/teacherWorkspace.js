/*
 * English strings for the teacher workspace (teacherWorkspace namespace) —
 * mirrors locales/he/teacherWorkspace.js key-for-key.
 */
export default {
  nav: {
    menu: "Menu",
    dashboard: "Dashboard",
    races: "Races",
    settings: "Settings",
    logout: "Log out",
    comingSoon: "Soon",
  },
  profile: {
    role: "Teacher",
  },
  greeting: {
    title: "Hello, {{name}}!",
    titleNoName: "Hello!",
    subtitle: "All of your races, at a glance.",
  },
  actions: {
    createRace: "Create a new race",
    viewAllRaces: "View all races",
  },
  stats: {
    active: "Active races",
    waiting: "Waiting races",
    cancelled: "Cancelled races",
    total: "Total races",
  },
  races: {
    title: "My races",
    columns: {
      name: "Race name",
      subject: "Subject",
      players: "Players",
      status: "Status",
      roomCode: "Room code",
      createdAt: "Created at",
    },
    open: "Open race",
    copyRoomCode: "Copy room code",
    copied: "Copied!",
  },
  raceStatus: {
    waiting: "Waiting",
    ready: "Ready",
    active: "Live",
    finished: "Finished",
    cancelled: "Cancelled",
    unknown: "Unknown",
  },
  createRace: {
    title: "Create a new race",
    nameLabel: "Race name",
    namePlaceholder: "e.g. Multiplication Grand Prix",
    subjectLabel: "Question category",
    subjectPlaceholder: "Pick a subject",
    subjectLoading: "Loading subjects...",
    subjectsLoadFailed: "We could not load the subjects list.",
    playersLabel: "Players",
    lengthLabel: "Race length",
    lengths: {
      short: "Short",
      regular: "Regular",
      long: "Long",
    },
    operatorsTitle: "Exercise types",
    operatorsSoon: "Coming soon: pick math operations per race",
    operators: {
      addition: "Addition",
      subtraction: "Subtraction",
      multiplication: "Multiplication",
      division: "Division",
    },
    submit: "Create race",
    cancel: "Cancel",
    successTitle: "Race created!",
    successBody: "Room code: {{roomCode}}",
    validation: {
      titleMinLength: "Race name must be at least {{min}} characters",
      titleMaxLength: "Race name can be up to {{max}} characters",
      subjectRequired: "Pick a question category",
    },
  },
  states: {
    loading: "Loading your dashboard...",
    errorTitle: "Something went wrong",
    errorBody: "We couldn't load the dashboard. Please try again in a moment.",
    retry: "Try again",
    emptyTitle: "No races yet",
    emptyBody: "Create your first race and bring the jungle to life!",
  },
};
