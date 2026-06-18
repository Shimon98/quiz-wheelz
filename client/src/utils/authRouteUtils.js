import { ROUTES } from "../constants/routeConstants";
import { USER_ROLES } from "../constants/roleConstants";

const ROLE_HOME_ROUTES = {
    [USER_ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
    [USER_ROLES.TEACHER]: ROUTES.TEACHER_DASHBOARD,
};

export function getRouteByRole(role) {
    return ROLE_HOME_ROUTES[role] ?? ROUTES.UNAUTHORIZED;
}