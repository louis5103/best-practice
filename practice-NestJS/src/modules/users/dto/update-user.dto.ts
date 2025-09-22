import { PartialType, OmitType } from '@nestjs/swagger';
import { 
  IsString, 
  MinLength, 
  MaxLength, 
  IsOptional,
  Matches,
  IsBoolean,
  IsEmail
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * 사용자 정보 수정 DTO입니다.
 * 
 * 이 DTO는 기존 사용자의 정보를 부분적으로 수정할 때 사용됩니다.
 * PartialType을 사용하여 CreateUserDto의 모든 필드를 선택사항으로 만들고,
 * OmitType을 사용하여 수정할 수 없는 필드(비밀번호)는 제외합니다.
 * 
 * 이는 마치 신분증 정정 신청서와 같은 개념입니다.
 * 모든 정보를 다시 작성할 필요 없이 변경하고 싶은 부분만 작성하면 됩니다.
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {
  /**
   * 사용자 이메일 주소입니다.
   * 
   * 이메일 변경은 신중해야 하므로 별도의 검증 로직이 필요할 수 있습니다.
   * (예: 새 이메일로 인증 메일 발송 등)
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
   * 일반 사용자는 자신의 역할을 변경할 수 없으며,
   * 관리자만 다른 사용자의 역할을 변경할 수 있습니다.
   */
  @ApiPropertyOptional({
    description: '변경할 사용자 역할 (관리자만 수정 가능)',
    example: 'moderator',
    enum: ['user', 'moderator', 'admin']
  })
  @IsOptional()
  @Matches(/^(user|moderator|admin)$/, {
    message: '역할은 user, moderator, admin 중 하나여야 합니다.'
  })
  role?: 'user' | 'moderator' | 'admin';

  /**
   * 계정 활성화 상태입니다.
   * 관리자가 사용자 계정을 활성화/비활성화할 때 사용합니다.
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
   * 관리자가 사용자의 이메일 인증 상태를 수동으로 변경할 때 사용합니다.
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
 * 보안상 비밀번호 변경은 별도의 엔드포인트와 DTO를 사용하는 것이 좋습니다.
 * 현재 비밀번호 확인 과정을 포함하여 더 안전한 비밀번호 변경 프로세스를 제공합니다.
 */
export class ChangePasswordDto {
  /**
   * 현재 비밀번호입니다.
   * 비밀번호 변경 시 본인 확인을 위해 필요합니다.
   */
  @ApiPropertyOptional({
    description: '현재 비밀번호 (본인 확인용)',
    example: 'currentPassword123!',
    format: 'password'
  })
  @IsString({ 
    message: '현재 비밀번호는 문자열이어야 합니다.' 
  })
  currentPassword: string;

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
  newPassword: string;

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
  newPasswordConfirm: string;
}
