package com.company.javafxdemo.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 사용자 엔티티 클래스
 * 
 * 기존 코드와의 중요한 차이점:
 * 원래 코드에서는 Entity와 DTO를 분리했지만, 여기서는 단일 클래스를 사용합니다.
 * 
 * 이런 결정을 내린 이유:
 * 1. 실무에서는 "적절한 복잡성"이 중요합니다
 * 2. 소규모 애플리케이션에서는 과도한 레이어 분리가 오히려 개발 속도를 늦출 수 있습니다
 * 3. Entity와 DTO의 구조가 거의 동일하다면 중복을 피하는 것이 좋습니다
 * 
 * 하지만 이것이 항상 정답은 아닙니다. 다음과 같은 경우에는 분리하는 것이 좋습니다:
 * - Entity에 민감한 정보가 있어서 UI에 노출하면 안 되는 경우
 * - Entity와 UI 표현이 크게 다른 경우  
 * - 여러 시스템 간에 데이터를 주고받아야 하는 경우
 * 
 * 이는 마치 요리에서 모든 양념을 다 넣는다고 맛있는 요리가 되지 않는 것과 같습니다.
 * 상황에 맞는 적절한 선택이 중요합니다.
 * 
 * @author JavaFX Demo Team
 * @version 1.0
 */
@Entity
@Table(name = "users")
@Data  // Lombok: getter, setter, toString, equals, hashCode 자동 생성
@NoArgsConstructor  // JPA가 엔티티를 생성할 때 필요한 기본 생성자
@AllArgsConstructor  // 모든 필드를 매개변수로 받는 생성자
@Builder  // 빌더 패턴 자동 생성 (객체 생성을 더 깔끔하게)
public class User {

    /**
     * 기본 키 (Primary Key)
     * 
     * @GeneratedValue(strategy = GenerationType.IDENTITY)의 의미:
     * 데이터베이스가 자동으로 ID 값을 생성하도록 합니다.
     * 
     * 이렇게 하는 이유:
     * 1. 개발자가 일일이 ID를 관리할 필요가 없습니다
     * 2. 동시성 문제를 데이터베이스가 해결해줍니다
     * 3. 중복 ID 발생을 방지할 수 있습니다
     * 
     * 마치 은행에서 계좌번호를 자동으로 발급해주는 것과 같습니다.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 사용자 이름
     * 
     * @Column 애노테이션의 속성들:
     * - nullable = false: 이름은 반드시 입력되어야 함
     * - length = 100: 최대 100자까지 허용
     * 
     * 이런 제약조건을 설정하는 이유:
     * 데이터베이스 레벨에서 데이터 무결성을 보장할 수 있습니다.
     * 이는 마치 건물의 설계도에서 안전 기준을 명시하는 것과 같습니다.
     */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * 이메일 주소
     * 
     * unique = true의 중요성:
     * 같은 이메일로 여러 계정이 만들어지는 것을 방지합니다.
     * 이는 실무에서 사용자 식별과 보안을 위해 매우 중요합니다.
     */
    @Column(name = "email", nullable = false, unique = true, length = 200)
    private String email;

    /**
     * 전화번호
     * 
     * nullable = true: 선택적 필드입니다.
     * 모든 정보를 필수로 만들면 사용자 경험이 나빠질 수 있습니다.
     * 정말 필요한 정보만 필수로 설정하는 것이 좋습니다.
     */
    @Column(name = "phone", length = 20)
    private String phone;

    /**
     * 부서명
     * 
     * 기존 코드와의 차이점:
     * 원래는 Department 엔티티와 @ManyToOne 관계를 설정했지만,
     * 여기서는 단순히 문자열로 저장합니다.
     * 
     * 이런 결정을 내린 이유:
     * 1. 부서 정보가 자주 변경되지 않는다면 정규화의 이점이 크지 않을 수 있습니다
     * 2. 쿼리가 더 단순해집니다 (JOIN이 불필요)
     * 3. 코드 복잡성이 줄어듭니다
     * 
     * 하지만 다음의 경우에는 별도 엔티티를 만드는 것이 좋습니다:
     * - 부서별로 상세한 정보(예: 위치, 매니저, 예산 등)를 관리해야 하는 경우
     * - 부서 정보가 자주 변경되는 경우
     * - 부서와 관련된 복잡한 비즈니스 로직이 있는 경우
     */
    @Column(name = "department", length = 100)
    private String department;

    /**
     * 활성 상태
     * 
     * 기본값을 true로 설정하는 이유:
     * 새로 생성된 사용자는 기본적으로 활성 상태여야 합니다.
     * 이는 사용자 경험과 비즈니스 로직을 고려한 결정입니다.
     */
    @Column(name = "active", nullable = false)
    @Builder.Default  // 빌더 패턴에서도 기본값 적용
    private Boolean active = true;

    /**
     * 생성 시간
     * 
     * @Column의 updatable = false 의미:
     * 이 필드는 레코드가 생성될 때만 설정되고, 
     * 이후 업데이트 시에는 변경되지 않습니다.
     * 
     * 이는 감사(audit) 목적으로 매우 중요한 정보입니다.
     * 마치 문서에 작성 날짜를 기록하는 것과 같습니다.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 수정 시간
     * 
     * 레코드가 마지막으로 수정된 시간을 기록합니다.
     * 이 정보는 데이터 변경 이력 추적에 유용합니다.
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * JPA 라이프사이클 메서드들
     * 
     * 이 메서드들은 JPA가 엔티티의 생명주기 동안 자동으로 호출합니다.
     * 마치 자동차의 시동을 걸 때 자동으로 실행되는 시스템 점검과 같습니다.
     */

    /**
     * 엔티티가 데이터베이스에 저장되기 전에 호출됩니다.
     * 여기서 생성 시간과 수정 시간을 자동으로 설정합니다.
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        
        // 기본값 설정 (혹시 빌더에서 설정되지 않았을 경우를 대비)
        if (this.active == null) {
            this.active = true;
        }
    }

    /**
     * 엔티티가 데이터베이스에서 업데이트되기 전에 호출됩니다.
     * 수정 시간만 업데이트합니다.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 비즈니스 메서드들
     * 
     * 엔티티는 단순한 데이터 컨테이너가 아닙니다.
     * 도메인 로직을 포함할 수 있고, 이렇게 하면 더 객체지향적인 설계가 됩니다.
     * 
     * 이는 마치 자동차 객체가 단순히 부품들의 집합이 아니라
     * "시동 걸기", "속도 높이기" 같은 행동을 할 수 있는 것과 같습니다.
     */

    /**
     * 이메일 형식이 유효한지 확인합니다.
     * 
     * @return 이메일이 유효하면 true, 그렇지 않으면 false
     */
    public boolean isValidEmail() {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        // 간단한 이메일 형식 검증
        // 실제 프로덕션에서는 더 정교한 검증이 필요할 수 있습니다
        return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    /**
     * 사용자가 활성 상태인지 확인합니다.
     * 
     * @return 활성 상태이면 true, 그렇지 않으면 false
     */
    public boolean isActive() {
        return this.active != null && this.active;
    }

    /**
     * 사용자를 비활성화합니다.
     * 
     * 실제 삭제 대신 비활성화하는 이유:
     * 1. 데이터 무결성 유지 (다른 테이블에서 참조하고 있을 수 있음)
     * 2. 감사 목적 (누가 언제 어떤 작업을 했는지 추적 가능)
     * 3. 실수로 삭제했을 때 복구 가능
     * 
     * 이는 마치 도서관에서 책을 완전히 폐기하지 않고
     * "대출 불가" 상태로 변경하는 것과 같습니다.
     */
    public void deactivate() {
        this.active = false;
    }

    /**
     * 사용자를 활성화합니다.
     */
    public void activate() {
        this.active = true;
    }

    /**
     * 사용자의 표시용 이름을 반환합니다.
     * UI에서 사용자를 표시할 때 유용합니다.
     * 
     * @return "이름 (부서)" 형태의 문자열
     */
    public String getDisplayName() {
        if (department != null && !department.trim().isEmpty()) {
            return String.format("%s (%s)", name, department);
        }
        return name;
    }

    /**
     * equals와 hashCode 메서드
     * 
     * Lombok의 @Data가 자동으로 생성해주지만,
     * JPA 엔티티의 경우 ID만 사용하는 것이 더 안전할 수 있습니다.
     * 
     * 이유: Hibernate 프록시 객체와의 호환성을 보장하기 위해서입니다.
     * 
     * 하지만 여기서는 @Data를 사용하여 모든 필드를 고려하는 방식을 유지합니다.
     * 소규모 애플리케이션에서는 이것으로도 충분하기 때문입니다.
     * 
     * 만약 복잡한 도메인 모델을 다루고 있다면 ID만 사용하는 방식으로 오버라이드하는 것을 고려해보세요.
     */

    /**
     * toString 메서드 커스터마이징
     * 
     * 기본 Lombok @Data의 toString은 모든 필드를 포함하는데,
     * 때로는 보안상 문제가 될 수 있습니다.
     * 
     * 여기서는 안전한 정보만 포함하도록 커스터마이징합니다.
     */
    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", department='" + department + '\'' +
                ", active=" + active +
                ", createdAt=" + createdAt +
                '}';
    }
}
