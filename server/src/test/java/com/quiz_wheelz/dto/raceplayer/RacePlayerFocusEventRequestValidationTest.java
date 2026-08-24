package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RacePlayerFocusEventRequestValidationTest {

    @Test
    void missingEventIdAndTypeAreRejectedByRequestValidation() {
        RacePlayerFocusEventRequest request = new RacePlayerFocusEventRequest();

        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            Set<String> invalidFields = validator.validate(request).stream()
                    .map(violation -> violation.getPropertyPath().toString())
                    .collect(Collectors.toSet());

            assertEquals(Set.of("eventId", "type"), invalidFields);
        }
    }

    @Test
    void publicEnumsContainOnlyTheApprovedFoundationVocabulary() {
        assertEquals(
                Set.of("TAB_HIDDEN", "TAB_VISIBLE"),
                names(RacePlayerFocusEventType.values())
        );
        assertEquals(
                Set.of("IGNORED", "VISIBLE", "WARNING", "VIOLATION"),
                names(RacePlayerFocusEventOutcome.values())
        );
    }

    private Set<String> names(Enum<?>[] values) {
        return Arrays.stream(values)
                .map(Enum::name)
                .collect(Collectors.toSet());
    }
}
