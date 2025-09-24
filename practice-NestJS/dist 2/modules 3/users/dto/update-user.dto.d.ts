import { CreateUserDto } from './create-user.dto';
declare const UpdateUserDto_base: import("@nestjs/common").Type<Partial<Omit<CreateUserDto, "password">>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    email?: string;
    name?: string;
    role?: 'user' | 'moderator' | 'admin';
    isActive?: boolean;
    isEmailVerified?: boolean;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
}
export {};
