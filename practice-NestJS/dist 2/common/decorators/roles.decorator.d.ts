export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const USER_ROLES: {
    readonly ADMIN: "admin";
    readonly MODERATOR: "moderator";
    readonly USER: "user";
};
export declare const ROLE_HIERARCHY: Record<string, string[]>;
export declare function hasRole(userRole: string, requiredRole: string): boolean;
export declare function hasAnyRole(userRole: string, requiredRoles: string[]): boolean;
