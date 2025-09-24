import { PartialType, OmitType } from '@nestjs/swagger';
import { 
  IsString, 
  MinLength, 
  MaxLength, 
  IsOptional,
  Matches,
  IsBoolean,
  IsEmail,
  IsEnum
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { UserRole } from '../../../common/types';

/**
 * 사용자 정보 수정 DTO입니다.
 * 
 * ✨ 개선사항: 공통 타입 시스템을 활용한 타입 안전성 보장
 * - UserRole enum 활용으로 CreateUserDto와 완벽한 호환성 확보
 * - TypeScript strict 모드 완전 호환
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {
  /**
   * 사용자 이메일 주소입니다.
   */
  @ApiPropertyOptional({
    description: '변경할 이메일 주소',
    example: 'newemail@example.com',
    format: 'email'
  })
  @IsOptional()
  @IsEmail({}, { 
    message: '올바른 이메일 형식을 입력해주세요.' 
  })
  email?: string;

  /**
   * 사용자 이름입니다.
   */
  @ApiPropertyOptional({
    description: '변경할 사용자 이름',
    example: '변경된이름',
    minLength: 2,
    maxLength: 50
  })
  @IsOptional()
  @IsString({ 
    message: '이름은 문자열이어야 합니다.' 
  })
  @MinLength(2, { 
    message: '이름은 최소 2자 이상이어야 합니다.' 
  })
  @MaxLength(50, { 
    message: '이름은 최대 50자까지 가능합니다.' 
  })
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '이름은 한글, 영문, 공백만 사용 가능합니다.'
  })
  name?: string;

  /**
   * 사용자 역할입니다.
   * 
   * ✨ 개선사항: UserRole enum을 사용하여 타입 안전성과 일관성 보장
   */
  @ApiPropertyOptional({
    description: '변경할 사용자 역할 (관리자만 수정 가능)',
    example: UserRole.MODERATOR,
    enum: UserRole
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: `역할은 다음 중 하나여야 합니다: ${Object.values(UserRole).join(', ')}`
  })
  role?: UserRole;

  /**
   * 계정 활성화 상태입니다.
   */
  @ApiPropertyOptional({
    description: '계정 활성화 상태 (관리자만 수정 가능)',
    example: true
  })
  @IsOptional()
  @IsBoolean({
    message: '활성화 상태는 true 또는 false여야 합니다.'
  })
  isActive?: boolean;

  /**
   * 이메일 인증 상태입니다.
   */
  @ApiPropertyOptional({
    description: '이메일 인증 완료 여부 (관리자만 수정 가능)',
    example: true
  })
  @IsOptional()
  @IsBoolean({
    message: '이메일 인증 상태는 true 또는 false여야 합니다.'
  })
  isEmailVerified?: boolean;
}

/**
 * 비밀번호 변경 전용 DTO입니다.
 * 
 * 보안상 비밀번호 변경은 별도의 엔드포인트와 DTO를 사용합니다.
 */
export class ChangePasswordDto {
  /**
   * 현재 비밀번호입니다.
   */
  @ApiPropertyOptional({
    description: '현재 비밀번호 (본인 확인용)',
    example: 'currentPassword123!',
    format: 'password'
  })
  @IsString({ 
    message: '현재 비밀번호는 문자열이어야 합니다.' 
  })
  currentPassword!: string;

  /**
   * 새로운 비밀번호입니다.
   */
  @ApiPropertyOptional({
    description: '새로운 비밀번호',
    example: 'newPassword123!',
    minLength: 8,
    maxLength: 128,
    format: 'password'
  })
  @IsString({ 
    message: '새 비밀번호는 문자열이어야 합니다.' 
  })
  @MinLength(8, { 
    message: '새 비밀번호는 최소 8자 이상이어야 합니다.' 
  })
  @MaxLength(128, { 
    message: '새 비밀번호는 최대 128자까지 가능합니다.' 
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: '새 비밀번호는 영문 대소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.'
    }
  )
  newPassword!: string;

  /**
   * 새로운 비밀번호 확인입니다.
   */
  @ApiPropertyOptional({
    description: '새로운 비밀번호 확인',
    example: 'newPassword123!',
    format: 'password'
  })
  @IsString({ 
    message: '새 비밀번호 확인은 문자열이어야 합니다.' 
  })
  newPasswordConfirm!: string;
}
