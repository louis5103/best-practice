import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { UserResponseDto, PaginatedUserResponseDto, UserStatsDto } from './dto/user-response.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly logger;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, req: Request): Promise<UserResponseDto>;
    findAll(req: Request, page?: string, limit?: string, search?: string): Promise<PaginatedUserResponseDto>;
    findOne(id: number, req: Request): Promise<UserResponseDto>;
    update(id: number, updateUserDto: UpdateUserDto, req: Request): Promise<UserResponseDto>;
    changePassword(id: number, changePasswordDto: ChangePasswordDto, req: Request): Promise<{
        message: string;
    }>;
    remove(id: number, req: Request): Promise<{
        message: string;
    }>;
    getStats(req: Request): Promise<UserStatsDto>;
}
