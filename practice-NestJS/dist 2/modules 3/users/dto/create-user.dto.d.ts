export declare class CreateUserDto {
    email: string;
    name: string;
    password: string;
    role?: 'user' | 'moderator' | 'admin';
    isActive?: boolean;
    isEmailVerified?: boolean;
}
