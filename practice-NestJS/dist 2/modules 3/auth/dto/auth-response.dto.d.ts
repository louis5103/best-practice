export declare class UserInfoDto {
    id: number;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: Date;
}
export declare class AuthResponseDto {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: UserInfoDto;
    message: string;
    timestamp: string;
}
export declare class RegisterResponseDto {
    message: string;
    user: UserInfoDto;
    nextStep: string;
    timestamp: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class LogoutResponseDto {
    message: string;
    timestamp: string;
}
