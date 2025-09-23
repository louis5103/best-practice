import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RedisService } from '@liaoliaots/nestjs-redis';
import * as bcrypt from 'bcrypt';

import { User } from '../../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { UserResponseDto, PaginatedUserResponseDto, UserStatsDto } from './dto/user-response.dto';

/**
 * 사용자 관리 서비스입니다.
 * 
 * 이 버전은 캐싱 로직을 단순화하여 실제 프로덕션 환경에서
 * 점진적으로 성능 최적화를 도입할 수 있도록 구성했습니다.
 * 
 * 캐싱 전략:
 * - 통계 데이터만 캐싱 (계산 비용이 높음)
 * - 개별 사용자 조회는 DB 직접 접근 (단순하고 빠름)
 * - 목록 조회는 초기에는 캐싱 없이 시작
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  
  // 캐싱은 정말 필요한 부분에만 적용
  private readonly CACHE_KEYS = {
    USER_STATS: 'users:stats',
  };

  private readonly CACHE_TTL = {
    USER_STATS: 300,   // 5분 - 통계는 실시간일 필요 없음
  };

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService
  ) {}

  /**
   * 새로운 사용자를 생성합니다.
   * 
   * 캐싱 없이 단순하게 구현 - 사용자 생성은 빈번하지 않은 작업이므로
   * 복잡한 캐시 무효화 로직보다는 단순성을 선택합니다.
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
      const newUser = this.userRepository.create({
        email,
        name,
        password, // User 엔티티의 @BeforeInsert 훅에서 자동 해시화
        role: role || 'user',
        isActive: isActive !== undefined ? isActive : true,
        isEmailVerified: isEmailVerified !== undefined ? isEmailVerified : false
      });

      // 데이터베이스에 저장
      const savedUser = await this.userRepository.save(newUser);

      // 통계 캐시만 무효화 (새로운 사용자로 인해 전체 수가 변경됨)
      await this.invalidateStatsCache();

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
   * 초기에는 캐싱 없이 시작 - 실제 성능 문제가 발생할 때 캐싱을 도입하는 것이
   * 더 현실적인 접근입니다. 이는 YAGNI(You Aren't Gonna Need It) 원칙을 따릅니다.
   */
  async findAll(
    page: number = 1, 
    limit: number = 10, 
    search?: string
  ): Promise<PaginatedUserResponseDto> {
    try {
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
   * 캐싱 없이 직접 DB 조회 - 단일 사용자 조회는 이미 충분히 빠르고,
   * 캐시 일관성 관리의 복잡성이 성능 이득을 상쇄할 수 있습니다.
   */
  async findOne(id: number): Promise<UserResponseDto> {
    try {
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

      return UserResponseDto.fromEntity(user);

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
   * 로그인 및 인증 과정에서 주로 사용됩니다.
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      // 이 메서드는 인증에 사용되므로 비밀번호도 함께 조회
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
   * 
   * 단순화된 업데이트 로직 - 캐시 무효화는 정말 필요한 부분(통계)에만 적용
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
      await this.userRepository.update(id, updateUserDto);

      // 업데이트된 사용자 정보 조회
      const updatedUser = await this.userRepository.findOne({
        where: { id },
        select: [
          'id', 'email', 'name', 'role', 'isActive',
          'isEmailVerified', 'lastLoginAt', 'createdAt', 'updatedAt'
        ]
      });

      // 역할이나 활성화 상태가 변경된 경우에만 통계 캐시 무효화
      if (updateUserDto.role || updateUserDto.isActive !== undefined) {
        await this.invalidateStatsCache();
      }

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
      throw new BadRequestException('비밀번호 변경 중 오류가 발생했습니다.');
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

      // 통계 캐시 무효화 (전체 사용자 수가 변경됨)
      await this.invalidateStatsCache();

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
   * 통계 계산은 비용이 높은 작업이므로 캐싱을 적용합니다.
   * 이는 캐싱이 정말 필요한 전형적인 사례입니다.
   */
  async getStats(): Promise<UserStatsDto> {
    try {
      // 캐시에서 먼저 확인
      const cacheKey = this.CACHE_KEYS.USER_STATS;
      const redis = this.redisService.getOrThrow();
      const cachedStats = await redis.get(cacheKey);

      if (cachedStats) {
        this.logger.debug('사용자 통계 캐시 히트');
        return JSON.parse(cachedStats);
      }

      // 데이터베이스에서 통계 계산
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        usersByRole,
        newUsersLastWeek
      ] = await Promise.all([
        // 전체 사용자 수
        this.userRepository.count(),
        
        // 활성화된 사용자 수
        this.userRepository.count({ where: { isActive: true } }),
        
        // 이메일 인증 완료 사용자 수
        this.userRepository.count({ where: { isEmailVerified: true } }),
        
        // 역할별 사용자 수
        this.userRepository
          .createQueryBuilder('user')
          .select('user.role', 'role')
          .addSelect('COUNT(*)', 'count')
          .groupBy('user.role')
          .getRawMany(),
        
        // 최근 7일간 신규 사용자 수
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
      await redis.setex(cacheKey, this.CACHE_TTL.USER_STATS, JSON.stringify(stats));

      return stats;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`사용자 통계 조회 중 오류 발생: ${errorMessage}`, errorStack);
      throw new BadRequestException('사용자 통계 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 통계 캐시만 무효화합니다.
   * 
   * 단순화된 캐시 무효화 - 정말 필요한 부분에만 적용
   */
  private async invalidateStatsCache(): Promise<void> {
    try {
      const redis = this.redisService.getOrThrow();
      await redis.del(this.CACHE_KEYS.USER_STATS);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      this.logger.warn(`통계 캐시 무효화 실패: ${errorMessage}`);
    }
  }
}
