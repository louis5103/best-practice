import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  Logger,
  Inject
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';

import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../common/types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { UserResponseDto, PaginatedUserResponseDto, UserStatsDto } from './dto/user-response.dto';

/**
 * 사용자 관리 서비스입니다.
 * 
 * ✨ 표준 NestJS 캐싱 시스템 도입:
 * - @nestjs/cache-manager 활용
 * - 안정적인 에러 핸들링과 graceful degradation
 * - 실무에서 검증된 캐싱 전략 적용
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  // 캐시 키 상수 정의
  private readonly CACHE_KEYS = {
    USER_STATS: 'users:stats',
    USER_LIST: 'users:list',
    USER_BY_ID: 'users:by-id',
  } as const;

  // 캐시 TTL 설정 (초 단위)
  private readonly CACHE_TTL = {
    USER_STATS: 300,      // 5분 - 통계는 실시간일 필요 없음
    USER_LIST: 60,        // 1분 - 목록은 자주 변경될 수 있음
    USER_DETAIL: 300,     // 5분 - 개별 사용자 정보
  } as const;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {}

  /**
   * 새로운 사용자를 생성합니다.
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, name, password, role, isActive, isEmailVerified } = createUserDto;

    try {
      // 이메일 중복 체크
      const existingUser = await this.userRepository.findOne({
        where: { email }
      });

      if (existingUser) {
        this.logger.warn(`사용자 생성 실패 - 중복된 이메일: ${email}`);
        throw new ConflictException('이미 사용 중인 이메일 주소입니다.');
      }

      // 새로운 사용자 엔티티 생성
      const userData = {
        email,
        name,
        password,
        role: (role || UserRole.USER) as UserRole,
        isActive: isActive !== undefined ? isActive : true,
        isEmailVerified: isEmailVerified !== undefined ? isEmailVerified : false
      };

      const newUser = this.userRepository.create(userData);

      // 데이터베이스에 저장
      const savedUser = await this.userRepository.save(newUser);

      // 관련 캐시 무효화 (사용자 추가로 인한 변경사항 반영)
      await this.invalidateUserCaches();

      this.logger.log(`사용자 생성 성공: ${email} (ID: ${savedUser.id})`);

      return UserResponseDto.fromEntity(savedUser);

    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`사용자 생성 중 오류 발생: ${errorMessage}`, errorStack);
      throw new BadRequestException('사용자 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * 페이지네이션을 적용하여 사용자 목록을 조회합니다.
   * 
   * 캐싱 전략: 자주 변경되는 목록이므로 짧은 TTL 적용
   */
  async findAll(
    page: number = 1, 
    limit: number = 10, 
    search?: string
  ): Promise<PaginatedUserResponseDto> {
    // 캐시 키 생성 (파라미터 포함)
    const cacheKey = `${this.CACHE_KEYS.USER_LIST}:${page}:${limit}:${search || 'all'}`;

    try {
      // 캐시에서 먼저 확인 (안전한 방식)
      const cachedResult = await this.safeGetFromCache<PaginatedUserResponseDto>(cacheKey);
      if (cachedResult) {
        this.logger.debug(`사용자 목록 캐시 히트: ${cacheKey}`);
        return cachedResult;
      }

      // 데이터베이스 쿼리 빌드
      let queryBuilder: SelectQueryBuilder<User> = this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id', 'user.email', 'user.name', 'user.role',
          'user.isActive', 'user.isEmailVerified', 'user.lastLoginAt',
          'user.createdAt', 'user.updatedAt'
        ]);

      // 검색 조건 적용
      if (search) {
        queryBuilder = queryBuilder.where(
          '(user.name ILIKE :search OR user.email ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // 페이지네이션 및 정렬 적용
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder
        .orderBy('user.createdAt', 'DESC')
        .skip(offset)
        .take(limit);

      // 데이터 조회 및 총 개수 계산
      const [users, total] = await queryBuilder.getManyAndCount();

      // DTO 변환
      const userDtos = UserResponseDto.fromEntities(users);
      const result = PaginatedUserResponseDto.create(userDtos, total, page, limit);

      // 캐시에 저장 (안전한 방식)
      await this.safeSetCache(cacheKey, result, this.CACHE_TTL.USER_LIST);

      this.logger.debug(`사용자 목록 조회 완료: ${users.length}명 (총 ${total}명)`);

      return result;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`사용자 목록 조회 중 오류 발생: ${errorMessage}`, errorStack);
      throw new BadRequestException('사용자 목록 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * ID로 특정 사용자를 조회합니다.
   * 
   * 캐싱 전략: 개별 사용자 정보는 상대적으로 안정적이므로 중간 TTL 적용
   */
  async findOne(id: number): Promise<UserResponseDto> {
    const cacheKey = `${this.CACHE_KEYS.USER_BY_ID}:${id}`;

    try {
      // 캐시에서 먼저 확인
      const cachedUser = await this.safeGetFromCache<UserResponseDto>(cacheKey);
      if (cachedUser) {
        this.logger.debug(`사용자 상세 캐시 히트: ${id}`);
        return cachedUser;
      }

      const user = await this.userRepository.findOne({
        where: { id },
        select: [
          'id', 'email', 'name', 'role', 'isActive', 
          'isEmailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'
        ]
      });

      if (!user) {
        throw new NotFoundException(`ID ${id}에 해당하는 사용자를 찾을 수 없습니다.`);
      }

      const result = UserResponseDto.fromEntity(user);

      // 캐시에 저장
      await this.safeSetCache(cacheKey, result, this.CACHE_TTL.USER_DETAIL);

      return result;

    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`사용자 조회 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
      throw new BadRequestException('사용자 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 이메일로 사용자를 조회합니다.
   * 
   * 인증용이므로 캐싱하지 않음 (보안상 이유)
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email })
        .getOne();

      return user;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`이메일로 사용자 조회 중 오류 발생 (${email}): ${errorMessage}`, errorStack);
      return null;
    }
  }

  /**
   * 사용자 정보를 수정합니다.
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      // 사용자 존재 여부 확인
      const existingUser = await this.userRepository.findOne({ where: { id } });
      
      if (!existingUser) {
        throw new NotFoundException(`ID ${id}에 해당하는 사용자를 찾을 수 없습니다.`);
      }

      // 이메일 변경 시 중복 체크
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.userRepository.findOne({
          where: { email: updateUserDto.email }
        });

        if (emailExists) {
          throw new ConflictException('이미 사용 중인 이메일 주소입니다.');
        }
      }

      // 업데이트 실행
      const updateData: Partial<User> = {};
      
      if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
      if (updateUserDto.name !== undefined) updateData.name = updateUserDto.name;
      if (updateUserDto.role !== undefined) updateData.role = updateUserDto.role;
      if (updateUserDto.isActive !== undefined) updateData.isActive = updateUserDto.isActive;
      if (updateUserDto.isEmailVerified !== undefined) updateData.isEmailVerified = updateUserDto.isEmailVerified;

      await this.userRepository.update(id, updateData);

      // 업데이트된 사용자 정보 조회
      const updatedUser = await this.userRepository.findOne({
        where: { id },
        select: [
          'id', 'email', 'name', 'role', 'isActive',
          'isEmailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'
        ]
      });

      if (!updatedUser) {
        throw new NotFoundException('사용자 업데이트 후 조회에 실패했습니다.');
      }

      // 관련 캐시 무효화
      await this.invalidateUserCaches(id);

      this.logger.log(`사용자 정보 수정 완료: ID ${id}`);

      return UserResponseDto.fromEntity(updatedUser);

    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`사용자 수정 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
      throw new BadRequestException('사용자 수정 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 비밀번호를 변경합니다.
   */
  async changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, newPasswordConfirm } = changePasswordDto;

    try {
      // 새 비밀번호 확인
      if (newPassword !== newPasswordConfirm) {
        throw new BadRequestException('새 비밀번호와 확인이 일치하지 않습니다.');
      }

      // 사용자 조회 (비밀번호 포함)
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.id = :id', { id })
        .getOne();

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      // 현재 비밀번호 확인
      const isCurrentPasswordValid = await user.validatePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
      }

      // 새 비밀번호 해시화 및 저장
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      await this.userRepository.update(id, { password: hashedNewPassword });

      this.logger.log(`비밀번호 변경 완료: 사용자 ID ${id}`);

    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`비밀번호 변경 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
      throw new BadRequestException('비밀번로 변경 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자를 삭제합니다.
   */
  async remove(id: number): Promise<void> {
    try {
      // 사용자 존재 여부 확인
      const user = await this.userRepository.findOne({ where: { id } });
      
      if (!user) {
        throw new NotFoundException(`ID ${id}에 해당하는 사용자를 찾을 수 없습니다.`);
      }

      // 삭제 실행
      await this.userRepository.delete(id);

      // 관련 캐시 무효화
      await this.invalidateUserCaches(id);

      this.logger.log(`사용자 삭제 완료: ID ${id} (${user.email})`);

    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`사용자 삭제 중 오류 발생 (ID: ${id}): ${errorMessage}`, errorStack);
      throw new BadRequestException('사용자 삭제 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 통계 정보를 조회합니다.
   * 
   * 캐싱 전략: 통계 계산은 비용이 높으므로 적극적으로 캐싱
   */
  async getStats(): Promise<UserStatsDto> {
    const cacheKey = this.CACHE_KEYS.USER_STATS;

    try {
      // 캐시에서 먼저 확인
      const cachedStats = await this.safeGetFromCache<UserStatsDto>(cacheKey);
      if (cachedStats) {
        this.logger.debug('사용자 통계 캐시 히트');
        return cachedStats;
      }

      // 데이터베이스에서 통계 계산
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        usersByRole,
        newUsersLastWeek
      ] = await Promise.all([
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

      // 역할별 사용자 수 객체로 변환
      const roleStats = usersByRole.reduce((acc, { role, count }) => {
        acc[role] = parseInt(count);
        return acc;
      }, { user: 0, moderator: 0, admin: 0 });

      const stats: UserStatsDto = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        verifiedUsers,
        usersByRole: roleStats,
        newUsersLastWeek: parseInt(newUsersLastWeek.toString())
      };

      // 캐시에 저장
      await this.safeSetCache(cacheKey, stats, this.CACHE_TTL.USER_STATS);

      this.logger.debug('사용자 통계 계산 완료 및 캐싱');

      return stats;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`사용자 통계 조회 중 오류 발생: ${errorMessage}`, errorStack);
      throw new BadRequestException('사용자 통계 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 캐시에서 안전하게 데이터를 가져옵니다.
   * 
   * 캐시 오류가 발생해도 애플리케이션이 중단되지 않도록 처리
   */
  private async safeGetFromCache<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.warn(`캐시 조회 실패 (키: ${key}):`, error);
      return null;
    }
  }

  /**
   * 캐시에 안전하게 데이터를 저장합니다.
   */
  private async safeSetCache<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.warn(`캐시 저장 실패 (키: ${key}):`, error);
    }
  }

  /**
   * 사용자 관련 캐시들을 무효화합니다.
   */
  private async invalidateUserCaches(userId?: number): Promise<void> {
    try {
      // 전체 사용자 관련 캐시 무효화
      await Promise.allSettled([
        this.cacheManager.del(this.CACHE_KEYS.USER_STATS),
        // 사용자 목록 캐시들 (패턴 매칭으로 삭제하기 어려우므로 시간 기반으로 만료)
        // 개별 사용자 캐시 (특정 사용자가 있는 경우)
        userId ? this.cacheManager.del(`${this.CACHE_KEYS.USER_BY_ID}:${userId}`) : Promise.resolve(),
      ]);

      this.logger.debug('사용자 캐시 무효화 완료');
    } catch (error) {
      this.logger.warn('캐시 무효화 실패:', error);
    }
  }
}
