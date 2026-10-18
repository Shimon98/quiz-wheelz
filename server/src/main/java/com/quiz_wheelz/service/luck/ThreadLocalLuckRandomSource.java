package com.quiz_wheelz.service.luck;

import org.springframework.stereotype.Component;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class ThreadLocalLuckRandomSource implements LuckRandomSource {
    @Override
    public double nextDouble() {
        return ThreadLocalRandom.current().nextDouble();
    }
}
