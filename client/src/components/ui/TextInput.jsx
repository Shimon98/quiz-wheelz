import { useState } from 'react';
import { LockKeyhole, LockKeyholeOpen, UserRound } from 'lucide-react';
import { UI_CLASSES } from '../../styles/theme';

export default function TextInput({
                                      label,
                                      error,
                                      className = '',
                                      type = 'text',
                                      wrapperClassName = '',
                                      ...props
                                  }) {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const inputStateClass = error
        ? UI_CLASSES.inputError
        : isPassword
            ? UI_CLASSES.inputPassword
            : UI_CLASSES.inputNormal;

    const finalClassName =
        `pr-14 pl-4 ${UI_CLASSES.input} ${inputStateClass} ${className}`.trim();

    return (
        <div dir="rtl" className={`w-full ${wrapperClassName}`.trim()}>
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
                        className={UI_CLASSES.inputPasswordIcon}
                        aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                    >
                        {showPassword ? (
                            <LockKeyholeOpen size={20} />
                        ) : (
                            <LockKeyhole size={20} />
                        )}
                    </button>
                ) : (
                    <span className={UI_CLASSES.inputIcon} aria-hidden="true">
                        <UserRound size={20} />
                    </span>
                )}

                <input type={inputType} className={finalClassName} {...props} />
            </div>

            <p className={UI_CLASSES.inputErrorText}>
                {error || '\u00A0'}
            </p>
        </div>
    );
}