import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function TextInput({
  label,
  error,
  className = '',
  type = 'text',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  const inputStyles =
    'w-full px-4 py-3 text-right border-2 rounded-lg transition-colors focus:outline-none';
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const borderColor = error
    ? 'border-red-500 focus:border-red-600'
    : 'border-gray-300 focus:border-blue-500';
  const passwordPadding = isPassword ? 'pl-14' : '';

  const finalClassName = `${passwordPadding} ${inputStyles} ${borderColor} ${className}`.trim();

  return (
    <div dir="rtl" className="w-full">
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
                className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 text-right">{error}</p>
      )}
    </div>
  );
}
