import { useState } from "react";
import { LockKeyhole, LockKeyholeOpen, UserRound } from "lucide-react";
import { UI_CLASSES } from "../../../styles/theme";
import { cx } from "../../../utils/classNameUtils";

export default function TextInput({
                                      label,
                                      error,
                                      className = "",
                                      type = "text",
                                      wrapperClassName = "",
                                      direction = "rtl",
                                      showPasswordLabel,
                                      hidePasswordLabel,
                                      icon = "user",
                                      ...props
                                  }) {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const isRtl = direction === "rtl";
    const inputType = isPassword && showPassword ? "text" : type;

    const inputStateClass = error
        ? UI_CLASSES.inputError
        : isPassword
            ? UI_CLASSES.inputPassword
            : UI_CLASSES.inputNormal;

    const passwordToggleLabel = showPassword
        ? hidePasswordLabel
        : showPasswordLabel;

    const inputPaddingClass = isRtl ? "pr-14 pl-4" : "pl-14 pr-4";
    const iconPositionClass = isRtl ? "right-3" : "left-3";

    const finalClassName = cx(
        inputPaddingClass,
        UI_CLASSES.input,
        inputStateClass,
        className,
    );

    return (
        <div dir={direction} className={cx("w-full", wrapperClassName)}>
            {label && (
                <label className={UI_CLASSES.inputLabel}>
                    {label}
                </label>
            )}

            <div className="relative">
                {isPassword ? (
                    <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className={cx(UI_CLASSES.inputPasswordIcon, iconPositionClass)}
                        aria-label={passwordToggleLabel}
                    >
                        {showPassword ? (
                            <LockKeyholeOpen size={20} aria-hidden="true" />
                        ) : (
                            <LockKeyhole size={20} aria-hidden="true" />
                        )}
                    </button>
                ) : (
                    icon === "user" && (
                        <span
                            className={cx(UI_CLASSES.inputIcon, iconPositionClass)}
                            aria-hidden="true"
                        >
                            <UserRound size={20} />
                        </span>
                    )
                )}

                <input
                    type={inputType}
                    className={finalClassName}
                    {...props}
                />
            </div>

            <p className={UI_CLASSES.inputErrorText}>
                {error || "\u00A0"}
            </p>
        </div>
    );
}