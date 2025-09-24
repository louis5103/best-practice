import { Repository } from 'typeorm';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { User } from '../../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { UserResponseDto, PaginatedUserResponseDto, UserStatsDto } from './dto/user-response.dto';
export declare class UsersService {
    private readonly userRepository;
    private readonly redisService;
    private readonly logger;
    private readonly CACHE_KEYS;
    private readonly CACHE_TTL;
    constructor(userRepository: Repository<User>, redisService: RedisService);
    create(createUserDto: CreateUserDto): Promise<UserResponseDto>;
    findAll(page?: number, limit?: number, search?: string): Promise<PaginatedUserResponseDto>;
    findOne(id: number): Promise<UserResponseDto>;
    findByEmail(email: string): Promise<User | null>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto>;
    changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void>;
    remove(id: number): Promise<void>;
    getStats(): Promise<UserStatsDto>;
    private invalidateStatsCache;
}
