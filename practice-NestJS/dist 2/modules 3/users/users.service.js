"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nestjs_redis_1 = require("@liaoliaots/nestjs-redis");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../../database/entities/user.entity");
const user_response_dto_1 = require("./dto/user-response.dto");
let UsersService = UsersService_1 = class UsersService {
    constructor(userRepository, redisService) {
        this.userRepository = userRepository;
        this.redisService = redisService;
        this.logger = new common_1.Logger(UsersService_1.name);
        this.CACHE_KEYS = {
            USER_STATS: 'users:stats',
        };
        this.CACHE_TTL = {
            USER_STATS: 300,
        };
    }
    async create(createUserDto) {
        const { email, name, password, role, isActive, isEmailVerified } = createUserDto;
        try {
            const existingUser = await this.userRepository.findOne({
                where: { email }
            });
            if (existingUser) {
                this.logger.warn(`사용자 생성 실패 - 중복된 이메일: ${email}`);
                throw new common_1.ConflictException('이미 사용 중인 이메일 주소입니다.');
            }
            const newUser = this.userRepository.create({
                email,
                name,
                password,
                role: role || 'user',
                isActive: isActive !== undefined ? isActive : true,
                isEmailVerified: isEmailVerified !== undefined ? isEmailVerified : false
            });
            const savedUser = await this.userRepository.save(newUser);
            await this.invalidateStatsCache();
            this.logger.log(`사용자 생성 성공: ${email} (ID: ${savedUser.id})`);
            return user_response_dto_1.UserResponseDto.fromEntity(savedUser);
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`사용자 생성 중 오류 발생: ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('사용자 생성 중 오류가 발생했습니다.');
        }
    }
    async findAll(page = 1, limit = 10, search) {
        try {
            let queryBuilder = this.userRepository
                .createQueryBuilder('user')
                .select([
                'user.id', 'user.email', 'user.name', 'user.role',
                'user.isActive', 'user.isEmailVerified', 'user.lastLoginAt',
                'user.createdAt', 'user.updatedAt'
            ]);
            if (search) {
                queryBuilder = queryBuilder.where('(user.name ILIKE :search OR user.email ILIKE :search)', { search: `%${search}%` });
            }
            const offset = (page - 1) * limit;
            queryBuilder = queryBuilder
                .orderBy('user.createdAt', 'DESC')
                .skip(offset)
                .take(limit);
            const [users, total] = await queryBuilder.getManyAndCount();
            const userDtos = user_response_dto_1.UserResponseDto.fromEntities(users);
            const result = user_response_dto_1.PaginatedUserResponseDto.create(userDtos, total, page, limit);
            this.logger.debug(`사용자 목록 조회 완료: ${users.length}명 (총 ${total}명)`);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`사용자 목록 조회 중 오류 발생: ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('사용자 목록 조회 중 오류가 발생했습니다.');
        }
    }
    async findOne(id) {
        try {
            const user = await this.userRepository.findOne({
                where: { id },
                select: [
                    'id', 'email', 'name', 'role', 'isActive',
                    'isEmailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'
                ]
            });
            if (!user) {
                throw new common_1.NotFoundException(`ID ${id}에 해당하는 사용자를 찾을 수 없습니다.`);
            }
            return user_response_dto_1.UserResponseDto.fromEntity(user);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`사용자 조회 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('사용자 조회 중 오류가 발생했습니다.');
        }
    }
    async findByEmail(email) {
        try {
            const user = await this.userRepository
                .createQueryBuilder('user')
                .addSelect('user.password')
                .where('user.email = :email', { email })
                .getOne();
            return user;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`이메일로 사용자 조회 중 오류 발생 (${email}): ${errorMessage}`, errorStack);
            return null;
        }
    }
    async update(id, updateUserDto) {
        try {
            const existingUser = await this.userRepository.findOne({ where: { id } });
            if (!existingUser) {
                throw new common_1.NotFoundException(`ID ${id}에 해당하는 사용자를 찾을 수 없습니다.`);
            }
            if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
                const emailExists = await this.userRepository.findOne({
                    where: { email: updateUserDto.email }
                });
                if (emailExists) {
                    throw new common_1.ConflictException('이미 사용 중인 이메일 주소입니다.');
                }
            }
            await this.userRepository.update(id, updateUserDto);
            const updatedUser = await this.userRepository.findOne({
                where: { id },
                select: [
                    'id', 'email', 'name', 'role', 'isActive',
                    'isEmailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'
                ]
            });
            if (updateUserDto.role || updateUserDto.isActive !== undefined) {
                await this.invalidateStatsCache();
            }
            this.logger.log(`사용자 정보 수정 완료: ID ${id}`);
            return user_response_dto_1.UserResponseDto.fromEntity(updatedUser);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`사용자 수정 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('사용자 수정 중 오류가 발생했습니다.');
        }
    }
    async changePassword(id, changePasswordDto) {
        const { currentPassword, newPassword, newPasswordConfirm } = changePasswordDto;
        try {
            if (newPassword !== newPasswordConfirm) {
                throw new common_1.BadRequestException('새 비밀번호와 확인이 일치하지 않습니다.');
            }
            const user = await this.userRepository
                .createQueryBuilder('user')
                .addSelect('user.password')
                .where('user.id = :id', { id })
                .getOne();
            if (!user) {
                throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
            }
            const isCurrentPasswordValid = await user.validatePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                throw new common_1.BadRequestException('현재 비밀번호가 올바르지 않습니다.');
            }
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);
            await this.userRepository.update(id, { password: hashedNewPassword });
            this.logger.log(`비밀번호 변경 완료: 사용자 ID ${id}`);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`비밀번호 변경 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('비밀번호 변경 중 오류가 발생했습니다.');
        }
    }
    async remove(id) {
        try {
            const user = await this.userRepository.findOne({ where: { id } });
            if (!user) {
                throw new common_1.NotFoundException(`ID ${id}에 해당하는 사용자를 찾을 수 없습니다.`);
            }
            await this.userRepository.delete(id);
            await this.invalidateStatsCache();
            this.logger.log(`사용자 삭제 완료: ID ${id} (${user.email})`);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`사용자 삭제 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('사용자 삭제 중 오류가 발생했습니다.');
        }
    }
    async getStats() {
        try {
            const cacheKey = this.CACHE_KEYS.USER_STATS;
            const redis = this.redisService.getOrThrow();
            const cachedStats = await redis.get(cacheKey);
            if (cachedStats) {
                this.logger.debug('사용자 통계 캐시 히트');
                return JSON.parse(cachedStats);
            }
            const [totalUsers, activeUsers, verifiedUsers, usersByRole, newUsersLastWeek] = await Promise.all([
                this.userRepository.count(),
                this.userRepository.count({ where: { isActive: true } }),
                this.userRepository.count({ where: { isEmailVerified: true } }),
                this.userRepository
                    .createQueryBuilder('user')
                    .select('user.role', 'role')
                    .addSelect('COUNT(*)', 'count')
                    .groupBy('user.role')
                    .getRawMany(),
                this.userRepository
                    .createQueryBuilder('user')
                    .where('user.createdAt >= :weekAgo', {
                    weekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                })
                    .getCount()
            ]);
            const roleStats = usersByRole.reduce((acc, { role, count }) => {
                acc[role] = parseInt(count);
                return acc;
            }, { user: 0, moderator: 0, admin: 0 });
            const stats = {
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                verifiedUsers,
                usersByRole: roleStats,
                newUsersLastWeek: parseInt(newUsersLastWeek.toString())
            };
            await redis.setex(cacheKey, this.CACHE_TTL.USER_STATS, JSON.stringify(stats));
            return stats;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`사용자 통계 조회 중 오류 발생: ${errorMessage}`, errorStack);
            throw new common_1.BadRequestException('사용자 통계 조회 중 오류가 발생했습니다.');
        }
    }
    async invalidateStatsCache() {
        try {
            const redis = this.redisService.getOrThrow();
            await redis.del(this.CACHE_KEYS.USER_STATS);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            this.logger.warn(`통계 캐시 무효화 실패: ${errorMessage}`);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        nestjs_redis_1.RedisService])
], UsersService);
//# sourceMappingURL=users.service.js.map