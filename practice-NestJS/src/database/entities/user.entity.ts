import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index
} from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * User 엔티티 - 사용자 정보를 저장하는 데이터베이스 테이블의 구조를 정의합니다.
 * 
 * 이 클래스는 마치 사람의 신분증과 같은 역할을 합니다.
 * 각 사용자의 기본 정보를 체계적으로 저장하고 관리할 수 있게 해줍니다.
 * 
 * TypeORM의 데코레이터들은 이 TypeScript 클래스를 실제 데이터베이스 테이블과
 * 연결해주는 마법과 같은 역할을 합니다.
 */
@Entity('users') // 데이터베이스에서 'users' 테이블로 생성됩니다
@Index(['email']) // 이메일 컬럼에 인덱스 생성 - 검색 성능 향상을 위해
export class User {
  /**
   * 기본 키(Primary Key) - 각 사용자를 고유하게 식별하는 번호입니다.
   * 
   * 이는 마치 주민등록번호와 같은 역할을 합니다.
   * 자동으로 증가하는 숫자이므로 개발자가 직접 값을 지정할 필요가 없습니다.
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * 이메일 주소 - 사용자의 로그인 ID 역할을 합니다.
   * 
   * unique: true로 설정하여 동일한 이메일로 여러 계정을 만들 수 없도록 합니다.
   * 이는 마치 하나의 핸드폰 번호로는 하나의 계정만 만들 수 있는 것과 같습니다.
   */
  @Column({ 
    unique: true, 
    length: 255,
    comment: '사용자 이메일 주소 (로그인 ID)' 
  })
  email!: string;

  /**
   * 사용자의 실제 이름입니다.
   * 
   * nullable: false가 기본값이므로 반드시 값이 있어야 합니다.
   * 길이 제한을 두어 데이터베이스 성능을 최적화합니다.
   */
  @Column({ 
    length: 100,
    comment: '사용자 실명' 
  })
  name!: string;

  /**
   * 비밀번호 - 보안을 위해 해시화되어 저장됩니다.
   * 
   * 실제 비밀번호가 아닌 암호화된 형태로 저장되므로,
   * 데이터베이스가 노출되어도 원본 비밀번호를 알 수 없습니다.
   * 이는 마치 금고에 보물을 암호화해서 넣어두는 것과 같습니다.
   */
  @Column({ 
    length: 255,
    comment: '암호화된 비밀번호' 
  })
  password!: string;

  /**
   * 사용자의 역할을 나타냅니다.
   * 
   * enum을 사용하여 허용된 값들만 저장할 수 있도록 제한합니다.
   * 기본값은 'user'로 설정하여 일반 사용자로 시작하게 합니다.
   */
  @Column({
    type: 'enum',
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
    comment: '사용자 권한 레벨'
  })
  role!: 'user' | 'admin' | 'moderator';

  /**
   * 계정 활성화 상태입니다.
   * 
   * 사용자가 이메일 인증을 완료했는지, 
   * 관리자가 계정을 비활성화했는지 등을 관리합니다.
   * 기본값은 true로 설정합니다.
   */
  @Column({ 
    default: true,
    comment: '계정 활성화 여부' 
  })
  isActive!: boolean;

  /**
   * 이메일 인증 완료 여부입니다.
   * 
   * 보안을 위해 이메일 인증을 완료한 사용자만
   * 모든 기능을 사용할 수 있도록 제한할 때 사용합니다.
   */
  @Column({ 
    default: false,
    comment: '이메일 인증 완료 여부' 
  })
  isEmailVerified!: boolean;

  /**
   * 마지막 로그인 시간입니다.
   * 
   * 사용자의 활동 패턴을 분석하거나,
   * 보안 목적으로 비정상적인 접근을 감지하는 데 사용할 수 있습니다.
   */
  @Column({ 
    type: 'timestamp',
    nullable: true,
    comment: '마지막 로그인 시간'
  })
  lastLoginAt!: Date;

  /**
   * 레코드 생성 시간 - 자동으로 현재 시간이 설정됩니다.
   * 
   * 이는 마치 편지에 자동으로 찍히는 소인과 같습니다.
   * 언제 이 사용자가 가입했는지 정확히 알 수 있습니다.
   */
  @CreateDateColumn({ 
    name: 'created_at',
    comment: '계정 생성 시간'
  })
  createdAt!: Date;

  /**
   * 레코드 수정 시간 - 업데이트될 때마다 자동으로 갱신됩니다.
   * 
   * 사용자 정보가 마지막으로 변경된 시점을 추적할 수 있어,
   * 데이터 관리나 보안 감사에 유용합니다.
   */
  @UpdateDateColumn({ 
    name: 'updated_at',
    comment: '정보 수정 시간'
  })
  updatedAt!: Date;

  /**
   * 엔티티가 데이터베이스에 저장되기 전에 실행되는 메서드입니다.
   * 
   * 이는 마치 편지를 우체통에 넣기 전에 봉투를 봉하는 것과 같습니다.
   * 비밀번호를 암호화하는 마지막 보안 처리를 담당합니다.
   * 
   * bcrypt는 현재 가장 안전한 해시 알고리즘 중 하나입니다.
   * 같은 비밀번호라도 매번 다른 해시값을 생성하여 보안성을 높입니다.
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    // 비밀번호가 변경되었을 때만 해시화를 수행합니다
    // 이미 해시된 비밀번호를 다시 해시하는 것을 방지하기 위해
    if (this.password && !this.password.startsWith('$2')) {
      // saltRounds 12는 보안과 성능의 균형점입니다
      // 너무 높으면 속도가 느려지고, 너무 낮으면 보안이 약해집니다
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  /**
   * 입력받은 평문 비밀번호와 저장된 해시 비밀번호를 비교합니다.
   * 
   * 이 메서드는 로그인할 때 사용됩니다.
   * 마치 열쇠와 자물쇠가 맞는지 확인하는 것과 같습니다.
   * 
   * @param plainPassword 사용자가 입력한 평문 비밀번호
   * @returns 비밀번호가 일치하면 true, 그렇지 않으면 false
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, this.password);
    } catch (error) {
      // 비교 과정에서 오류가 발생하면 보안을 위해 false를 반환
      console.error('비밀번호 검증 중 오류 발생:', error);
      return false;
    }
  }

  /**
   * 민감한 정보를 제거한 사용자 정보를 반환합니다.
   * 
   * 이는 마치 공개용 명함에서 개인정보를 제외하고 
   * 필요한 정보만 보여주는 것과 같습니다.
   * API 응답에서 비밀번호 등 민감한 정보가 노출되는 것을 방지합니다.
   */
  toSafeObject(): Partial<User> {
    const { password, ...safeUser } = this;
    return safeUser;
  }
}
