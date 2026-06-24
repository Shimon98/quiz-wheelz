import teacherLoginBg from '../../../assets/backgrounds/teacher-login-bg.png';
import studentLoginBg from '../../../assets/backgrounds/student-login-bg.png';
import {UI_VARIANTS} from "../../../constants/uiConstants.js";

export default function PageBackground({
                                           children,
                                           variant =UI_VARIANTS.USER,
                                           className = '',
                                       }) {

    const backgroundByVariant = {
        user: teacherLoginBg,
        student: studentLoginBg,
    };

    const backgroundImage = backgroundByVariant[variant] ?? teacherLoginBg;
    const backgroundPositionByVariant = {
        user: 'center',
        student: 'center bottom',
    };
    return (
        <main
            className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-sky-100 px-4 py-8 ${className}`.trim()}
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: backgroundPositionByVariant[variant] ?? 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="absolute inset-0 bg-white/10" />

            <div className="relative z-10 w-full">
                {children}
            </div>
        </main>
    );
}
