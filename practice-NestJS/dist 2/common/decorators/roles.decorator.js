"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_HIERARCHY = exports.USER_ROLES = exports.Roles = exports.ROLES_KEY = void 0;
exports.hasRole = hasRole;
exports.hasAnyRole = hasAnyRole;
const common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
exports.USER_ROLES = {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    USER: 'user'
};
exports.ROLE_HIERARCHY = {
    [exports.USER_ROLES.ADMIN]: [exports.USER_ROLES.ADMIN, exports.USER_ROLES.MODERATOR, exports.USER_ROLES.USER],
    [exports.USER_ROLES.MODERATOR]: [exports.USER_ROLES.MODERATOR, exports.USER_ROLES.USER],
    [exports.USER_ROLES.USER]: [exports.USER_ROLES.USER]
};
function hasRole(userRole, requiredRole) {
    const userPermissions = exports.ROLE_HIERARCHY[userRole] || [userRole];
    return userPermissions.includes(requiredRole);
}
function hasAnyRole(userRole, requiredRoles) {
    return requiredRoles.some(requiredRole => hasRole(userRole, requiredRole));
}
//# sourceMappingURL=roles.decorator.js.map