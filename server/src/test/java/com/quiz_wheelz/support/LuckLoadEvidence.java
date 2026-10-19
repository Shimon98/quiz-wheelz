package com.quiz_wheelz.support;

import com.quiz_wheelz.service.luck.LuckPeerJdbcResources;
import com.zaxxer.hikari.HikariDataSource;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.List;

public final class LuckLoadEvidence implements AutoCloseable {
    private final List<Double> latency = new java.util.concurrent.CopyOnWriteArrayList<>();
    private final AtomicInteger writerActive = new AtomicInteger();
    private final AtomicInteger writerIdle = new AtomicInteger();
    private final AtomicInteger writerWaiting = new AtomicInteger();
    private final AtomicInteger readerActive = new AtomicInteger();
    private final AtomicInteger readerIdle = new AtomicInteger();
    private final AtomicInteger readerWaiting = new AtomicInteger();
    private final ScheduledExecutorService sampler = Executors.newSingleThreadScheduledExecutor();
    private final HikariDataSource writer;
    private final LuckPeerJdbcResources reader;
    private final String label;

    public LuckLoadEvidence(String label, HikariDataSource writer, LuckPeerJdbcResources reader) {
        this.label = label;
        this.writer = writer;
        this.reader = reader;
        sampler.scheduleAtFixedRate(this::sample, 0, 1, TimeUnit.MILLISECONDS);
    }

    private void sample() {
        var primary = writer.getHikariPoolMXBean();
        writerActive.accumulateAndGet(primary.getActiveConnections(), Math::max);
        writerIdle.accumulateAndGet(primary.getIdleConnections(), Math::max);
        writerWaiting.accumulateAndGet(primary.getThreadsAwaitingConnection(), Math::max);
        var peer = reader.snapshot();
        readerActive.accumulateAndGet(peer.active(), Math::max);
        readerIdle.accumulateAndGet(peer.idle(), Math::max);
        readerWaiting.accumulateAndGet(peer.waiting(), Math::max);
    }

    public void completed(long started) {
        latency.add((System.nanoTime() - started) / 1_000_000.0);
    }

    private double percentile(List<Double> sorted, double probability) {
        return sorted.get(Math.max(0, (int) Math.ceil(sorted.size() * probability) - 1));
    }

    @Override
    public void close() {
        sampler.shutdownNow();
        var sorted = latency.stream().sorted().toList();
        if (sorted.isEmpty()) return;
        System.out.println("LUCK_SAMPLES " + label + " " + sorted);
        System.out.printf(java.util.Locale.ROOT,
                "LUCK_LOAD %s samples=%d p50=%.3f p95=%.3f p99=%.3f worst=%.3f ms writerMax=%d readerMax=%d writerPeak=%d/%d/%d readerPeak=%d/%d/%d samplingMs=1%n",
                label, sorted.size(), percentile(sorted, .5), percentile(sorted, .95), percentile(sorted, .99),
                sorted.getLast(), writer.getMaximumPoolSize(), reader.snapshot().maximum(),
                writerActive.get(), writerIdle.get(), writerWaiting.get(), readerActive.get(), readerIdle.get(), readerWaiting.get());
    }
}
