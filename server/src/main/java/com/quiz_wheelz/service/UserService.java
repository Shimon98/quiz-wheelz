package com.quiz_wheelz.service;

import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final String INVALID_LOGIN_MESSAGE = "Invalid username or password";

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User findByIdOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public User findActiveByIdOrThrow(Long userId) {
        User user = findByIdOrThrow(userId);
        validateUserIsActive(user);
        return user;
    }

    @Transactional(readOnly = true)
    public User findByUsernameOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public User findByUsernameForLoginOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.UNAUTHORIZED,
                        INVALID_LOGIN_MESSAGE
                ));
    }

    public void validateUserIsActive(User user) {
        if (!user.isActive()) {
            throw new ApiException(ErrorCode.USER_INACTIVE);
        }
    }
}