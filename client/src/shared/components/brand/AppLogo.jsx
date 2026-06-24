import gameLogo from '../../../assets/logos/gameLogo.png';
import {UI_VARIANTS} from "../../../constants/uiConstants.js";



export default function AppLogo({variant = UI_VARIANTS.USER, subtitle, showSubtitle = true, className = '',}) {

    const subtitleByVariant = {
        user: 'התחברות למשתמש רשום',
        student: 'הצטרפות תלמיד למרוץ',
    };
    const sizeByVariant = {
        user: 'h-24 sm:h-28 md:h-32',
        student: 'h-20 sm:h-24 md:h-28',
    };
    const finalSubtitle = subtitle ?? subtitleByVariant[variant];
    const logoSize = sizeByVariant[variant] ?? sizeByVariant.teacher;

    return (
        <div className={`mb-4 text-center ${className}`.trim()}>
            <img
                src={gameLogo}
                alt="QuizWheelz"
                className={`mx-auto w-auto object-contain drop-shadow-xl ${logoSize}`}
                draggable="false"
            />

            {showSubtitle && finalSubtitle && (
                <p className="mt-4 bg-gradient-to-l from-indigo-900 via-sky-700 to-violet-800 bg-clip-text text-[22px] font-black leading-tight tracking-wide text-transparent drop-shadow-[0_2px_1px_rgba(255,255,255,0.8)]">
                    {finalSubtitle}
                </p>
            )}
        </div>
    );
}
