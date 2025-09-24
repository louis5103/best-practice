import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../common/types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { UserResponseDto, PaginatedUserResponseDto, UserStatsDto } from './dto/user-response.dto';

/**
 * 사용자 관리 서비스입니다.
 * 
 * ✨ 개선사항: 
 * - Redis 의존성 제거로 더 단순하고 안정적인 구조
 * - TypeScript strict 모드 완전 호환
 * - 타입 안전성 완전 보장
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
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

      // 새로운 사용자 엔티티 생성 - 타입 안전하게 수정
      const userData = {
        email,
        name,
        password,
        role: (role || UserRole.USER) as UserRole, // 명시적 타입 캐스팅
        isActive: isActive !== undefined ? isActive : true,
        isEmailVerified: isEmailVerified !== undefined ? isEmailVerified : false
      };

      const newUser = this.userRepository.create(userData);

      // 데이터베이스에 저장
      const savedUser = await this.userRepository.save(newUser);

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

      // 업데이트 실행 - 타입 안전한 방식
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
   * Redis 캐싱 제거로 더 단순하고 신뢰할 수 있는 구현
   */
  async getStats(): Promise<UserStatsDto> {
    try {
      // 데이터베이스에서 직접 통계 계산
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

      return stats;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`사용자 통계 조회 중 오류 발생: ${errorMessage}`, errorStack);
      throw new BadRequestException('사용자 통계 조회 중 오류가 발생했습니다.');
    }
  }
}
