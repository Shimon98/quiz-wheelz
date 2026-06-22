export const TEACHER_DASHBOARD_CONTENT = {
    he: {
        sidebar: {
            logoText: "QuizWheelz",
            nav: {
                dashboard: "לוח מחוונים",
                races: "מרוצים",
                createRace: "יצירת מרוץ חדש",
                students: "תלמידים",
                subjects: "נושאים",
                results: "תוצאות",
                settings: "הגדרות",
            },
            comingSoon: "בקרוב",
        },
        topBar: {
            roleLabel: "מורה",
            greetingFallback: "מורה",
            logoutButton: "התנתקות",
            logoutLoading: "מתנתק...",
        },
        hero: {
            title: "ברוכים השבים למסלול ההוראה",
            subtitle: "מכאן תוכל ליצור מרוצי למידה ולנהל את הכיתה שלך.",
        },
        racePreview: {
            racesTitle: "המרוצים שלי",
            racesDescription: "בהמשך יוצגו כאן המרוצים שהמורה יצר.",
            createRaceButton: "יצירת מרוץ חדש",
            emptyRacesMessage: "עדיין אין מרוצים להצגה.",
        },
    },
    en: {
        sidebar: {
            logoText: "QuizWheelz",
            nav: {
                dashboard: "Dashboard",
                races: "Races",
                createRace: "Create Race",
                students: "Students",
                subjects: "Subjects",
                results: "Results",
                settings: "Settings",
            },
            comingSoon: "Coming soon",
        },
        topBar: {
            roleLabel: "Teacher",
            greetingFallback: "Teacher",
            logoutButton: "Logout",
            logoutLoading: "Logging out...",
        },
        hero: {
            title: "Welcome back to the learning track",
            subtitle: "Create learning races and manage your classroom from here.",
        },
        racePreview: {
            racesTitle: "My races",
            racesDescription: "Races created by the teacher will appear here.",
            createRaceButton: "Create new race",
            emptyRacesMessage: "No races to display yet.",
        },
    },
};

export const TEACHER_DASHBOARD_STATS_CONTENT = {
    he: {
        totalRaces: "סך כל המרוצים",
        activeRaces: "מרוצים פעילים",
        finishedRaces: "מרוצים שהסתיימו",
        waitingRaces: "ממתינים לתלמידים",
    },
    en: {
        totalRaces: "Total races",
        activeRaces: "Active races",
        finishedRaces: "Finished races",
        waitingRaces: "Waiting for players",
    },
};

export const TEACHER_DASHBOARD_RACE_CONTENT = {
    he: {
        loadError: "לא הצלחנו לטעון את המרוצים כרגע. נסו שוב בעוד רגע.",
        meta: {
            roomCode: "קוד חדר",
            players: "שחקנים",
            distance: "מרחק",
            created: "נוצר בתאריך",
            notScheduled: "לא נקבע",
            distancePoints: "{value} נקודות",
        },
        actions: {
            edit: "ערוך",
            cancel: "בטל",
            raceActions: "פעולות מרוץ",
            openRoom: "פתח חדר",
            viewLiveRace: "צפה במרוץ חי",
            viewResults: "צפה בתוצאות",
            unavailable: "לא זמין",
        },
        statusLabels: {
            WAITING_FOR_PLAYERS: "ממתין לשחקנים",
            READY: "מוכן",
            IN_PROGRESS: "במהלך המרוץ",
            FINISHED: "הסתיים",
            CANCELLED: "בוטל",
            unknown: "לא ידוע",
        },
    },
    en: {
        loadError: "Could not load races right now. Please try again soon.",
        meta: {
            roomCode: "Room code",
            players: "Players",
            distance: "Distance",
            created: "Created",
            notScheduled: "Not scheduled",
            distancePoints: "{value} points",
        },
        actions: {
            edit: "Edit",
            cancel: "Cancel",
            raceActions: "Race actions",
            openRoom: "Open room",
            viewLiveRace: "View live race",
            viewResults: "View results",
            unavailable: "Unavailable",
        },
        statusLabels: {
            WAITING_FOR_PLAYERS: "Waiting for players",
            READY: "Ready",
            IN_PROGRESS: "In progress",
            FINISHED: "Finished",
            CANCELLED: "Cancelled",
            unknown: "Unknown",
        },
    },
};

export const CREATE_RACE_CONTENT = {
    he: {
        title: "יצירת מרוץ חדש",
        description: "בחרו נושא, מספר שחקנים ואורך מרוץ לפני פתיחת החדר.",
        closeLabel: "סגירת חלון יצירת מרוץ",
        fields: {
            title: "שם המרוץ",
            titlePlaceholder: "לדוגמה: מרוץ חשבון כיתה ג",
            subject: "נושא",
            subjectPlaceholder: "בחרו נושא",
            maxPlayers: "מספר שחקנים",
            raceLength: "אורך המרוץ",
            // initialMode: "מצב פתיחה",
            // initialModeValue: "ממתין לתלמידים",
        },
        raceLengths: {
            short: "קצר",
            regular: "רגיל",
            long: "ארוך",
            points: "{value} נקודות",
        },
        buttons: {
            cancel: "ביטול",
            submit: "יצירת מרוץ",
            submitting: "יוצר מרוץ...",
        },
        states: {
            loadingSubjects: "טוען נושאים...",
            noSubjects: "אין נושאים זמינים כרגע.",
        },
        validation: {
            titleRequired: "יש להזין שם מרוץ.",
            subjectRequired: "יש לבחור נושא.",
            maxPlayersRequired: "יש לבחור מספר שחקנים.",
            totalDistanceRequired: "יש לבחור אורך מרוץ.",
        },
    },
    en: {
        title: "Create new race",
        description: "Choose a subject, player count, and race length before opening the room.",
        closeLabel: "Close create race dialog",
        fields: {
            title: "Race title",
            titlePlaceholder: "Example: Grade 3 number race",
            subject: "Subject",
            subjectPlaceholder: "Choose a subject",
            maxPlayers: "Players",
            raceLength: "Race length",
            // initialMode: "Initial mode",
            // initialModeValue: "Waiting for students",
        },
        raceLengths: {
            short: "Short",
            regular: "Regular",
            long: "Long",
            points: "{value} points",
        },
        buttons: {
            cancel: "Cancel",
            submit: "Create race",
            submitting: "Creating race...",
        },
        states: {
            loadingSubjects: "Loading subjects...",
            noSubjects: "No subjects are available right now.",
        },
        validation: {
            titleRequired: "Enter a race title.",
            subjectRequired: "Choose a subject.",
            maxPlayersRequired: "Choose the number of players.",
            totalDistanceRequired: "Choose a race length.",
        },
    },
};

export const TEACHER_RACE_ROOM_CONTENT = {
    he: {
        pageTitleFallback: "חדר מרוץ",
        loadingError: "לא הצלחנו לטעון את חדר המרוץ כרגע. נסו שוב בעוד רגע.",
        subjectLabel: "נושא",
        statusLabel: "סטטוס",
        playersLabel: "שחקנים",
        roomCodeTitle: "קוד החדר",
        roomCodeDescription: "התלמידים משתמשים בקוד הזה כדי להצטרף למרוץ.",
        copyCode: "העתק קוד",
        shareLink: "שתף קישור",
        actionsTitle: "פעולות מרוץ",
        editRace: "ערוך מרוץ",
        cancelRace: "בטל מרוץ",
        startRace: "התחל מרוץ",
        startRaceDisabledHint: "התחלת מרוץ תחובר בהמשך.",
        playersTitle: "תלמידים בחדר",
        playersEmpty: "עדיין אין תלמידים בחדר.",
        playerNameFallback: "תלמיד",
        joinedLabel: "מחובר",
    },
    en: {
        pageTitleFallback: "Race room",
        loadingError: "Could not load the race room right now. Please try again soon.",
        subjectLabel: "Subject",
        statusLabel: "Status",
        playersLabel: "Players",
        roomCodeTitle: "Room code",
        roomCodeDescription: "Students use this code to join the race.",
        copyCode: "Copy code",
        shareLink: "Share link",
        actionsTitle: "Race actions",
        editRace: "Edit race",
        cancelRace: "Cancel race",
        startRace: "Start race",
        startRaceDisabledHint: "Starting a race will be connected later.",
        playersTitle: "Students in room",
        playersEmpty: "No students are in the room yet.",
        playerNameFallback: "Student",
        joinedLabel: "Joined",
    },
};






export const TEACHER_RACE_WAITING_ROOM_CONTENT = {
    he: {
        header: {
            backToRaces: "חזרה למרוצים",
            titleFallback: "חדר המתנה למרוץ",
            statusFallback: "סטטוס לא ידוע",
        },

        joinPanel: {
            roomCodeTitle: "קוד חדר",
            roomCodeDescription: "שתפו את הקוד עם התלמידים כדי שיצטרפו למרוץ.",
            roomCodeFallback: "------",
            qrText: "סרקו להצטרפות",
            qrAriaLabel: "אזור קוד QR להצטרפות",
        },

        actions: {
            copyCode: "העתק קוד",
            shareLink: "שתף קישור",
            editRace: "ערוך מרוץ",
            startRace: "התחל מרוץ",
            startRaceDisabledHint: "התחלת מרוץ תחובר בהמשך.",
        },

        infoCards: {
            subject: {
                label: "נושא",
                emptyValue: "לא נבחר",
            },
            maxPlayers: {
                label: "שחקנים מקסימליים",
                emptyValue: "0",
            },
            joinedPlayers: {
                label: "הצטרפו",
                emptyValue: "0",
            },
        },

        participants: {
            title: "תלמידים בחדר",
            emptySlot: "ממתין לנהג...",
            playerFallback: "תלמיד",
            joinedMark: "✓",
        },

        settings: {
            title: "הגדרות מרוץ",
            raceType: {
                label: "סוג מרוץ",
                value: "קלאסי",
            },
            winCondition: {
                label: "תנאי ניצחון",
                value: "ראשון שמגיע",
            },
            questionTime: {
                label: "זמן לשאלה",
                value: "מותאם",
            },
            trackLength: {
                label: "אורך מסלול",
                valueFallback: "רגיל",
                valueUnit: "מטר",
            },
            questionOrder: {
                label: "סדר שאלות",
                value: "אקראי",
            },
        },

        quickActions: {
            title: "פעולות מהירות",
            cancelRace: "בטל מרוץ",
            futureHint: "פעולה זו תחובר בהמשך.",
        },
    },

    en: {
        header: {
            backToRaces: "Back to races",
            titleFallback: "Race waiting room",
            statusFallback: "Unknown status",
        },

        joinPanel: {
            roomCodeTitle: "Room code",
            roomCodeDescription: "Share the code with students so they can join the race.",
            roomCodeFallback: "------",
            qrText: "Scan to join",
            qrAriaLabel: "QR code area for joining",
        },

        actions: {
            copyCode: "Copy code",
            shareLink: "Share link",
            editRace: "Edit race",
            startRace: "Start race",
            startRaceDisabledHint: "Starting a race will be connected later.",
        },

        infoCards: {
            subject: {
                label: "Subject",
                emptyValue: "Not selected",
            },
            maxPlayers: {
                label: "Max players",
                emptyValue: "0",
            },
            joinedPlayers: {
                label: "Joined",
                emptyValue: "0",
            },
        },

        participants: {
            title: "Students in room",
            emptySlot: "Waiting for driver...",
            playerFallback: "Student",
            joinedMark: "✓",
        },

        settings: {
            title: "Race settings",
            raceType: {
                label: "Race type",
                value: "Classic",
            },
            winCondition: {
                label: "Win condition",
                value: "First to finish",
            },
            questionTime: {
                label: "Question time",
                value: "Adaptive",
            },
            trackLength: {
                label: "Track length",
                valueFallback: "Regular",
                valueUnit: "meters",
            },
            questionOrder: {
                label: "Question order",
                value: "Random",
            },
        },

        quickActions: {
            title: "Quick actions",
            cancelRace: "Cancel race",
            futureHint: "This action will be connected later.",
        },
    },
};