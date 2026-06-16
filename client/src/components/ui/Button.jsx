export default function Button({children, type = 'button',
  isLoading = false,
  disabled = false,
  className = '', fullWidth = true, ...props}) {

  const baseStyles =
      'min-h-14 px-6 py-4 text-lg font-bold rounded-2xl shadow-md transition active:scale-95 focus:outline-none focus:ring-4';
  const widthStyles = fullWidth ? 'w-full' : 'w-auto';
  const colorStyles = disabled || isLoading
      ? 'bg-gray-400 text-white cursor-not-allowed'
      : 'bg-sky-500 hover:bg-sky-600 text-white active:bg-sky-700 focus:ring-sky-200';

  const finalClassName = `${baseStyles} ${widthStyles} ${colorStyles} ${className}`.trim();

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={finalClassName}
      {...props}
    >
      {isLoading ? 'טוען...' : children}
    </button>
  );
}
