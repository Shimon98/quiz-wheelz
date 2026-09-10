package com.quiz_wheelz.common;

public final class TeacherRaceLiveStreamRules {

    public static final int REPLAY_BATCH_SIZE = 100;
    public static final long DISPATCH_INTERVAL_MS = 1_000L;
    public static final long HEARTBEAT_INTERVAL_MS = 15_000L;
    public static final String HEARTBEAT_COMMENT = "heartbeat";
    public static final String LAST_EVENT_ID_HEADER = "Last-Event-ID";
    public static final String AFTER_VERSION_PARAMETER = "afterVersion";
    public static final String SCHEDULER_BEAN_NAME =
            "teacherRaceLiveStreamTaskScheduler";
    public static final String SCHEDULER_THREAD_NAME_PREFIX =
            "teacher-live-sse-";
    public static final int SCHEDULER_POOL_SIZE = 1;

    private TeacherRaceLiveStreamRules() {
    }
}
