import gameLogo from '../../assets/logos/gameLogo.png';

const subtitleByVariant = {
    teacher: 'התחברות מורה למערכת המרוץ',
    student: 'הצטרפות תלמיד למרוץ',
};

const sizeByVariant = {
    teacher: 'h-24 sm:h-28 md:h-32',
    student: 'h-20 sm:h-24 md:h-28',
};

export default function AppLogo({
                                    variant = 'teacher',
                                    subtitle,
                                    showSubtitle = true,
                                    className = '',
                                }) {
    const finalSubtitle = subtitle ?? subtitleByVariant[variant];
    const logoSize = sizeByVariant[variant] ?? sizeByVariant.teacher;

    return (
        <div className={`mb-6 text-center ${className}`.trim()}>
            <img
                src={gameLogo}
                alt="QuizWheelz"
                className={`mx-auto w-auto object-contain drop-shadow-xl ${logoSize}`}
                draggable="false"
            />

            {showSubtitle && finalSubtitle && (
                <p className="mt-3 text-sm font-extrabold text-slate-700 drop-shadow-sm sm:text-base">
                    {finalSubtitle}
                </p>
            )}
        </div>
    );
}