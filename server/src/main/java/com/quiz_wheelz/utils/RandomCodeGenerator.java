package com.quiz_wheelz.utils;

import java.security.SecureRandom;

public final class RandomCodeGenerator {

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private RandomCodeGenerator() {
    }

    public static String generateCode(int length) {
        if (length <= 0) {
            throw new IllegalArgumentException("Code length must be positive");
        }

        StringBuilder builder = new StringBuilder();

        for (int i = 0; i < length; i++) {
            builder.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }

        return builder.toString();
    }
}