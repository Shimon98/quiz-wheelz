import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { UI_CLASSES } from '../../styles/theme';

export default function TextInput({label, error, className = '', type = 'text', wrapperClassName = '',
                                      ...props}) {

    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const borderColor = error ? UI_CLASSES.inputError : UI_CLASSES.inputNormal;
    const passwordPadding = isPassword ? 'pl-14' : '';

    const finalClassName =
        `${passwordPadding} ${UI_CLASSES.input} ${borderColor} ${className}`.trim();

    return (
        <div dir="rtl" className={`w-full ${wrapperClassName}`.trim()}>
            {label && (
                <label className="mb-2 block text-sm font-bold text-slate-700">
                    {label}
                </label>
            )}

            <div className="relative">
                <input type={inputType} className={finalClassName} {...props} />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>

            <p className="mt-2 min-h-5 text-right text-sm font-semibold text-red-600">
                {error || '\u00A0'}
            </p>
        </div>
    );
}