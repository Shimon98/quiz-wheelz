import { useState } from "react";
import { useInterval } from "@mantine/hooks";
import {
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from "../../../api/authApi";
import { useLanguageStore } from "../../../stores/languageStore";
import useErrorMessage from "../../../hooks/useErrorMessage";
import {
  FORGOT_PASSWORD_STEPS,
  RESEND_COOLDOWN_SECONDS,
} from "../config/teacherAuthConfig";

// 47 → "00:47", matching the vision's countdown format.
function formatSecondsAsClock(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/**
 * useForgotPasswordFlow — the whole 3-step reset flow as one state machine
 * (request email → verify 6-digit code → set new password → done), so the
 * content component only renders the current step from props.
 *
 * The email + verified code are held here between steps and sent together with
 * the new password at the final step (the server re-validates everything —
 * client state is never trusted). Includes the resend-code cooldown timer.
 * Client-ready end-to-end; goes live when the server ships the endpoints.
 */
export default function useForgotPasswordFlow() {
  const language = useLanguageStore((state) => state.language);
  const { errorMessage, clearErrorMessage, setErrorMessageFromApiError } =
    useErrorMessage(language);

  const [step, setStep] = useState(FORGOT_PASSWORD_STEPS.REQUEST);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const countdown = useInterval(() => {
    setResendSecondsLeft((seconds) => {
      if (seconds <= 1) {
        countdown.stop();
        return 0;
      }
      return seconds - 1;
    });
  }, 1000);

  function startResendCooldown() {
    setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
    countdown.start();
  }

  async function runStep(action, onSuccess) {
    clearErrorMessage();
    setSubmitting(true);
    try {
      await action();
      onSuccess();
    } catch (error) {
      setErrorMessageFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function submitRequest({ email: requestedEmail }) {
    return runStep(
      () => requestPasswordReset({ email: requestedEmail }),
      () => {
        setEmail(requestedEmail);
        setStep(FORGOT_PASSWORD_STEPS.VERIFY);
        startResendCooldown();
      },
    );
  }

  function resendCode() {
    if (resendSecondsLeft > 0) {
      return Promise.resolve();
    }
    return runStep(
      () => requestPasswordReset({ email }),
      startResendCooldown,
    );
  }

  function submitCode({ code: enteredCode }) {
    return runStep(
      () => verifyResetCode({ email, code: enteredCode }),
      () => {
        setCode(enteredCode);
        setStep(FORGOT_PASSWORD_STEPS.RESET);
      },
    );
  }

  function submitNewPassword({ newPassword }) {
    return runStep(
      () => resetPassword({ email, code, newPassword }),
      () => setStep(FORGOT_PASSWORD_STEPS.DONE),
    );
  }

  return {
    step,
    email,
    submitting,
    errorMessage,
    resendSecondsLeft,
    resendClock: formatSecondsAsClock(resendSecondsLeft),
    submitRequest,
    resendCode,
    submitCode,
    submitNewPassword,
  };
}
