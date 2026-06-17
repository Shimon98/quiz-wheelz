import { UI_CLASSES } from '../../styles/theme';
import { DEFAULT_LANGUAGE } from '../../constants/messageConstants.js';
import { AUTH_TEXT } from '../../constants/authConstants.js';

export default function Button({children, type = 'button', isLoading = false, disabled = false, className = '',
                                 fullWidth = true, language = DEFAULT_LANGUAGE, ...props
                               })
{
  const authText = AUTH_TEXT[language] ?? AUTH_TEXT.he;
  const baseStyles =
      'min-h-14 px-6 py-4 text-lg font-bold rounded-2xl shadow-md transition active:scale-95 focus:outline-none focus:ring-4';

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
        {isLoading ? authText.labels.loading : children}
      </button>
  );
}