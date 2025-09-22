import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

/**
 * 사용자 응답 DTO입니다.
 * 
 * 이 DTO는 사용자 정보를 클라이언트에게 안전하게 전달하기 위한 구조체입니다.
 * 민감한 정보(비밀번호 등)는 제외하고 필요한 정보만을 포함합니다.
 * 
 * 마치 신분증에서 공개 가능한 정보만 보여주는 것과 같은 개념입니다.
 * 내부적으로는 더 많은 정보를 가지고 있지만, 외부로는 안전한 정보만 노출합니다.
 */
export class UserResponseDto {
  /**
   * 사용자 고유 식별자입니다.
   */
  @ApiProperty({
    description: '사용자 고유 ID',
    example: 1
  })
  id: number;

  /**
   * 사용자 이메일 주소입니다.
   */
  @ApiProperty({
    description: '사용자 이메일 주소',
    example: 'user@example.com'
  })
  email: string;

  /**
   * 사용자 실명입니다.
   */
  @ApiProperty({
    description: '사용자 이름',
    example: '김철수'
  })
  name: string;

  /**
   * 사용자 권한 레벨입니다.
   */
  @ApiProperty({
    description: '사용자 역할',
    example: 'user',
    enum: ['user', 'moderator', 'admin']
  })
  role: 'user' | 'moderator' | 'admin';

  /**
   * 계정 활성화 상태입니다.
   */
  @ApiProperty({
    description: '계정 활성화 여부',
    example: true
  })
  isActive: boolean;

  /**
   * 이메일 인증 완료 여부입니다.
   */
  @ApiProperty({
    description: '이메일 인증 완료 여부',
    example: true
  })
  isEmailVerified: boolean;

  /**
   * 마지막 로그인 시간입니다.
   * 
   * null일 수 있으므로 선택적 속성으로 정의합니다.
   */
  @ApiPropertyOptional({
    description: '마지막 로그인 시간',
    example: '2024-01-15T10:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  lastLoginAt?: Date;

  /**
   * 계정 생성 시간입니다.
   */
  @ApiProperty({
    description: '계정 생성 시간',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  createdAt: Date;

  /**
   * 계정 정보 수정 시간입니다.
   */
  @ApiProperty({
    description: '정보 마지막 수정 시간',
    example: '2024-01-10T15:45:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  updatedAt: Date;

  /**
   * 비밀번호 필드입니다.
   * 
   * @Exclude 데코레이터를 사용하여 응답에서 자동으로 제외됩니다.
   * 이는 클래스 변환 시 보안을 위해 민감한 정보를 숨기는 중요한 기능입니다.
   */
  @Exclude()
  password?: string;

  /**
   * User 엔티티를 UserResponseDto로 변환하는 정적 메서드입니다.
   * 
   * 이 메서드는 마치 번역기와 같은 역할을 합니다.
   * 데이터베이스의 User 엔티티를 클라이언트에게 안전하게 전달할 수 있는
   * 형태로 변환해줍니다.
   * 
   * @param user User 엔티티
   * @returns UserResponseDto 안전한 사용자 응답 객체
   */
  static fromEntity(user: any): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.role = user.role;
    dto.isActive = user.isActive;
    dto.isEmailVerified = user.isEmailVerified;
    dto.lastLoginAt = user.lastLoginAt;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    
    return dto;
  }

  /**
   * 여러 User 엔티티를 UserResponseDto 배열로 변환하는 정적 메서드입니다.
   * 
   * 사용자 목록을 조회할 때 사용됩니다.
   * 
   * @param users User 엔티티 배열
   * @returns UserResponseDto[] 안전한 사용자 응답 객체 배열
   */
  static fromEntities(users: any[]): UserResponseDto[] {
    return users.map(user => this.fromEntity(user));
  }
}

/**
 * 페이지네이션된 사용자 목록 응답 DTO입니다.
 * 
 * 대량의 사용자 데이터를 효율적으로 전달하기 위해 페이지네이션 정보를 포함합니다.
 * 이는 마치 책의 페이지와 같은 개념으로, 전체 데이터를 작은 단위로 나누어 제공합니다.
 */
export class PaginatedUserResponseDto {
  /**
   * 현재 페이지의 사용자 목록입니다.
   */
  @ApiProperty({
    description: '현재 페이지의 사용자 목록',
    type: [UserResponseDto]
  })
  data: UserResponseDto[];

  /**
   * 전체 사용자 수입니다.
   */
  @ApiProperty({
    description: '전체 사용자 수',
    example: 150
  })
  total: number;

  /**
   * 현재 페이지 번호입니다.
   */
  @ApiProperty({
    description: '현재 페이지 번호',
    example: 1
  })
  page: number;

  /**
   * 페이지당 항목 수입니다.
   */
  @ApiProperty({
    description: '페이지당 사용자 수',
    example: 10
  })
  limit: number;

  /**
   * 전체 페이지 수입니다.
   */
  @ApiProperty({
    description: '전체 페이지 수',
    example: 15
  })
  totalPages: number;

  /**
   * 이전 페이지 존재 여부입니다.
   */
  @ApiProperty({
    description: '이전 페이지 존재 여부',
    example: false
  })
  hasPrevious: boolean;

  /**
   * 다음 페이지 존재 여부입니다.
   */
  @ApiProperty({
    description: '다음 페이지 존재 여부',
    example: true
  })
  hasNext: boolean;

  /**
   * 페이지네이션 정보를 포함한 응답 객체를 생성하는 정적 메서드입니다.
   * 
   * @param data 사용자 데이터 배열
   * @param total 전체 사용자 수
   * @param page 현재 페이지
   * @param limit 페이지당 항목 수
   * @returns PaginatedUserResponseDto
   */
  static create(
    data: UserResponseDto[], 
    total: number, 
    page: number, 
    limit: number
  ): PaginatedUserResponseDto {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages
    };
  }
}

/**
 * 사용자 통계 정보 DTO입니다.
 * 
 * 관리자 대시보드에서 사용할 수 있는 사용자 관련 통계 정보를 제공합니다.
 */
export class UserStatsDto {
  /**
   * 전체 사용자 수입니다.
   */
  @ApiProperty({
    description: '전체 사용자 수',
    example: 1250
  })
  totalUsers: number;

  /**
   * 활성화된 사용자 수입니다.
   */
  @ApiProperty({
    description: '활성화된 사용자 수',
    example: 1180
  })
  activeUsers: number;

  /**
   * 비활성화된 사용자 수입니다.
   */
  @ApiProperty({
    description: '비활성화된 사용자 수',
    example: 70
  })
  inactiveUsers: number;

  /**
   * 이메일 인증을 완료한 사용자 수입니다.
   */
  @ApiProperty({
    description: '이메일 인증 완료 사용자 수',
    example: 1100
  })
  verifiedUsers: number;

  /**
   * 역할별 사용자 수입니다.
   */
  @ApiProperty({
    description: '역할별 사용자 수',
    example: {
      user: 1200,
      moderator: 40,
      admin: 10
    }
  })
  usersByRole: {
    user: number;
    moderator: number;
    admin: number;
  };

  /**
   * 최근 7일간 가입한 사용자 수입니다.
   */
  @ApiProperty({
    description: '최근 7일간 신규 사용자 수',
    example: 45
  })
  newUsersLastWeek: number;
}
