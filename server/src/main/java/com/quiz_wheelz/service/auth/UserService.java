package com.quiz_wheelz.service.auth;

import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.exception.AuthMessages;
import com.quiz_wheelz.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

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
                        AuthMessages.INVALID_USERNAME_OR_PASSWORD
                ));
    }

    public void validateUserIsActive(User user) {
        if (!user.isActive()) {
            throw new ApiException(ErrorCode.USER_INACTIVE);
        }
    }
}