import gameLogo from '../../assets/logos/gameLogo.png';
import {UI_VARIANTS} from "../../constants/uiConstants.js";



export default function AppLogo({
                                    variant = UI_VARIANTS.USER,
                                    subtitle,
                                    showSubtitle = true,
                                    className = '',}) {

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
