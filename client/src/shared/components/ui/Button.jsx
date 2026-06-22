import { UI_CLASSES } from '../../styles/theme.js';
import { DEFAULT_LANGUAGE } from '../../constants/messageConstants.js';
import { AUTH_TEXT } from '../../constants/authConstants.js';

export default function Button({children, type = 'button', isLoading = false, disabled = false, className = '',
                                   fullWidth = true, language = DEFAULT_LANGUAGE, ...props}) {

    const authText = AUTH_TEXT[language] ?? AUTH_TEXT.he;
    const baseStyles =
        'relative min-h-16 px-7 py-4 rounded-[26px] transition-all duration-150 ease-out active:scale-[0.98] focus:outline-none focus:ring-4';

    const widthStyles = fullWidth ? 'w-full' : 'w-auto';
    const colorStyles =
        disabled || isLoading
            ? UI_CLASSES.disabledButton
            : UI_CLASSES.primaryButton;

    const finalClassName =
        `${baseStyles} ${widthStyles} ${colorStyles} ${className}`.trim();

    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            className={finalClassName}
            {...props}
        >
            <span className="pointer-events-none absolute inset-x-5 top-1.5 h-1.5 rounded-full bg-white/30" />

            <span className="relative z-10 text-[30px] font-black leading-none tracking-wide drop-shadow-[0_2px_1px_rgba(124,45,18,0.45)]">
                {isLoading ? authText.labels.loading : children}</span>

        </button>
    );
}
