/*
 * English strings for the teacher auth screens (teacherAuth namespace) —
 * login / register / forgot-password flow, matching docs/vision/teacher-auth-flow.png.
 */
export default {
  // Shared labels — written ONCE, reused by every auth screen.
  common: {
    emailLabel: "Email",
    emailPlaceholder: "teacher@example.com",
    passwordLabel: "Password",
  },
  login: {
    title: "Welcome back, teacher",
    subtitle: "Sign in to your teacher account",
    forgotPassword: "Forgot password?",
    submit: "Sign in",
    noAccount: "Don't have an account?",
    registerLink: "Register here",
    checkingSession: "Checking your session...",
  },
  register: {
    title: "Create a new teacher account",
    subtitle: "Join us and start building engaging quiz races",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Dana Levi",
    confirmPasswordLabel: "Confirm password",
    acceptsEmailsLabel: "I agree to receive emails from QuizWheelz",
    submit: "Create account",
    hasAccount: "Already have an account?",
    loginLink: "Sign in here",
    successTitle: "Account created!",
    successBody: "You can now sign in with your new details.",
  },
  forgot: {
    requestTitle: "We'll email you a verification code",
    requestSubtitle: "Enter your email and we'll send a password reset code",
    requestSubmit: "Email me a code",
    sentNote: "Sent! If this email exists in our system, a reset code is on its way.",
    verifyTitle: "Enter the verification code",
    verifySubtitle: "We sent a {{codeLength}}-digit code to {{email}}",
    verifySubmit: "Continue",
    noCode: "Didn't get a code?",
    resendIn: "Resend in {{time}}",
    resend: "Resend",
    resetTitle: "Set a new password",
    resetSubtitle: "Choose a new, secure password for your account",
    newPasswordLabel: "New password",
    confirmPasswordLabel: "Confirm new password",
    resetSubmit: "Update password",
    successNote: "Your password was updated! You can now sign in.",
    backToLogin: "Back to sign in",
  },
  validation: {
    identifierRequired: "Please enter an email or username",
    emailRequired: "Please enter an email",
    emailInvalid: "This email address is not valid",
    fullNameRequired: "Please enter your full name",
    passwordRequired: "Please enter a password",
    passwordMinLength: "Password must be at least {{min}} characters",
    passwordsMismatch: "Passwords do not match",
    codeIncomplete: "Please enter all {{codeLength}} digits",
  },
};
