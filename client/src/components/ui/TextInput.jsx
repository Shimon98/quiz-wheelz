import {useState} from 'react';
import {Eye, EyeOff} from 'lucide-react';

export default function TextInput({label, error, className = '',
                                      type = 'text', wrapperClassName = '', ...props}) {

    const [showPassword, setShowPassword] = useState(false);
    const inputStyles =
        'w-full px-4 py-3 text-right border-2 rounded-2xl bg-white/90 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-4';

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const borderColor = error
        ? 'border-red-500 focus:border-red-600 focus:ring-red-100'
        : 'border-gray-300 focus:border-sky-500 focus:ring-sky-100';
    const passwordPadding = isPassword ? 'pl-14' : '';
    const finalClassName = `${passwordPadding} ${inputStyles} ${borderColor} ${className}`.trim();

    return (
        <div dir="rtl" className={`w-full ${wrapperClassName}`.trim()}>
            {label && (
                <label className="block mb-2 text-sm font-semibold text-gray-700">
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
                        {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600 text-right">{error}</p>
            )}
        </div>
    );
}
