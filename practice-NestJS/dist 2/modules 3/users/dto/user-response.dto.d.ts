export declare class UserResponseDto {
    id: number;
    email: string;
    name: string;
    role: 'user' | 'moderator' | 'admin';
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    password?: string;
    static fromEntity(user: any): UserResponseDto;
    static fromEntities(users: any[]): UserResponseDto[];
}
export declare class PaginatedUserResponseDto {
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    static create(data: UserResponseDto[], total: number, page: number, limit: number): PaginatedUserResponseDto;
}
export declare class UserStatsDto {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    verifiedUsers: number;
    usersByRole: {
        user: number;
        moderator: number;
        admin: number;
    };
    newUsersLastWeek: number;
}
