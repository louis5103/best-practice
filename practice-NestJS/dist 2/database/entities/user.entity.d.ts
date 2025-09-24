import { UserRole } from '../../common/types';
export declare class User {
    id: number;
    email: string;
    name: string;
    password: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
    hashPassword(): Promise<void>;
    validatePassword(plainPassword: string): Promise<boolean>;
    toSafeObject(): Partial<User>;
}
