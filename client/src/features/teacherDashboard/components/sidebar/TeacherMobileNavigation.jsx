import { useState } from "react";
import { Menu } from "lucide-react";

import { useLocaleContent } from "../../../../constants/localeConstants";
import { useLanguageStore } from "../../../../stores/languageStore";
import { getLanguageDirection } from "../../../../utils/languageDirectionUtils";
import { TEACHER_DASHBOARD_CONTENT } from "../../content/teacherDashboardContent";
import { TEACHER_MOBILE_NAV_STYLES } from "../../styles/dashboardUiStyles";
import Modal from "../../../../shared/components/ui/Modal";
import ModalCloseButton from "../../../../shared/components/ui/ModalCloseButton";
import TeacherSidebarPanel from "./TeacherSidebarPanel";

const MOBILE_NAV_TITLE_ID = "teacher-mobile-nav-title";

export default function TeacherMobileNavigation({
    onDashboardClick,
    onRacesClick,
    onCreateRaceClick,
    teacherName,
    onLogout,
    isLoggingOut = false,
}) {
    const [isOpen, setIsOpen] = useState(false);

    const content = useLocaleContent(TEACHER_DASHBOARD_CONTENT).sidebar;
    const language = useLanguageStore((state) => state.language);
    const direction = getLanguageDirection(language);

    function openDrawer() {
        setIsOpen(true);
    }

    function closeDrawer() {
        setIsOpen(false);
    }

    return (
        <>
            <div className={TEACHER_MOBILE_NAV_STYLES.triggerRow}>
                <button
                    type="button"
                    onClick={openDrawer}
                    aria-label={content.openMenu}
                    aria-expanded={isOpen}
                    className={TEACHER_MOBILE_NAV_STYLES.triggerButton}
                >
                    <Menu
                        aria-hidden="true"
                        className={TEACHER_MOBILE_NAV_STYLES.triggerIcon}
                    />
                </button>
            </div>

            <Modal
                isOpen={isOpen}
                onClose={closeDrawer}
                direction={direction}
                titleId={MOBILE_NAV_TITLE_ID}
                overlayClassName={TEACHER_MOBILE_NAV_STYLES.drawerOverlay}
                panelClassName={TEACHER_MOBILE_NAV_STYLES.drawerPanel}
            >
                <h2 id={MOBILE_NAV_TITLE_ID} className="sr-only">
                    {content.navTitle}
                </h2>

                <ModalCloseButton
                    ariaLabel={content.closeMenu}
                    onClick={closeDrawer}
                    className={TEACHER_MOBILE_NAV_STYLES.drawerClose}
                />

                <TeacherSidebarPanel
                    onDashboardClick={onDashboardClick}
                    onRacesClick={onRacesClick}
                    onCreateRaceClick={onCreateRaceClick}
                    teacherName={teacherName}
                    onLogout={onLogout}
                    isLoggingOut={isLoggingOut}
                    onAfterNavigate={closeDrawer}
                />
            </Modal>
        </>
    );
}
