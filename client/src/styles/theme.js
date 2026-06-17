export const UI_CLASSES = {
    card:
        'rounded-[2rem] border border-white/65 bg-sky-50/40 p-7 text-right shadow-[0_24px_60px_rgba(14,116,144,0.22)] backdrop-blur-lg ring-1 ring-white/35',

    primaryButton:
        'overflow-hidden bg-gradient-to-b from-yellow-300 via-orange-400 to-orange-500 text-white border-2 border-orange-300/80 shadow-[0_4px_10px_rgba(234,88,12,0.28)] hover:from-yellow-200 hover:via-orange-300 hover:to-orange-500 hover:shadow-[0_5px_12px_rgba(234,88,12,0.32)] active:from-orange-400 active:via-orange-500 active:to-orange-600 active:shadow-[0_2px_6px_rgba(234,88,12,0.25)] focus:ring-orange-200',

    disabledButton:
        'bg-gray-400 text-white cursor-not-allowed',

    input:
        'w-full min-h-14 rounded-[22px] border-2 px-5 py-3 text-right text-base font-extrabold text-slate-700 placeholder:text-indigo-400 placeholder:font-extrabold transition-all duration-150 focus:outline-none focus:ring-4',

    inputNormal:

        'border-cyan-300 bg-amber-50/95 shadow-sm focus:border-cyan-400 focus:bg-white focus:ring-cyan-100',

    inputPassword:
        'border-sky-300 bg-sky-50/90 shadow-sm focus:border-sky-400 focus:bg-white focus:ring-sky-100',

    inputError:
        'border-rose-300 bg-rose-50/70 text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-rose-400 focus:ring-rose-100',

    inputIcon:
        'absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-violet-600 shadow-sm ring-1 ring-white/80',

    inputPasswordIcon:
        'absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-orange-500 shadow-sm ring-1 ring-white/80 transition hover:scale-105 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-200',

    inputLabel:
        'mb-2 block text-sm font-extrabold tracking-wide text-indigo-800 drop-shadow-sm sm:text-base',

    inputErrorText:
        'mt-1 min-h-4 px-2 text-right text-xs font-bold tracking-wide text-rose-500 sm:text-sm',


    formError:
        'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-right text-sm font-semibold text-red-600',

    secondaryLink:
        'text-sm font-extrabold text-violet-700 transition hover:text-sky-700 hover:underline',
};
