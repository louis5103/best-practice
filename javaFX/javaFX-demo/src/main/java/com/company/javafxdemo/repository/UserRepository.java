package com.company.javafxdemo.repository;

import com.company.javafxdemo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 사용자 데이터 액세스를 담당하는 리포지토리
 * 
 * 기존 코드와의 중요한 개선사항:
 * 원래 코드에서는 너무 많은 메서드를 정의해서 복잡성을 증가시켰습니다.
 * 여기서는 "실제로 필요한 기능만" 정의하는 실용적 접근법을 사용합니다.
 * 
 * 이는 마치 도구상자에서 실제로 사용하는 도구들만 준비하는 것과 같습니다.
 * 모든 가능한 도구를 다 넣으면 도구상자가 무겁고 찾기도 어려워집니다.
 * 
 * Spring Data JPA의 강력함:
 * 인터페이스만 정의하면 Spring이 자동으로 구현체를 생성해줍니다.
 * 메서드 이름만으로도 쿼리가 자동 생성되는 것이 핵심 장점입니다.
 * 
 * 예를 들어:
 * - findByEmail → SELECT * FROM users WHERE email = ?
 * - findByNameContainingIgnoreCase → SELECT * FROM users WHERE UPPER(name) LIKE UPPER('%?%')
 * 
 * @author JavaFX Demo Team
 * @version 1.0
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /*
     * ============================================================================
     * 기본 CRUD 작업은 JpaRepository에서 제공됩니다
     * ============================================================================
     * 
     * JpaRepository<User, Long>을 상속받으면 다음 메서드들을 자동으로 사용할 수 있습니다:
     * - save(User user) : 사용자 저장/수정
     * - findById(Long id) : ID로 사용자 조회  
     * - findAll() : 모든 사용자 조회
     * - deleteById(Long id) : ID로 사용자 삭제
     * - count() : 총 사용자 수 조회
     * - existsById(Long id) : 특정 ID 사용자 존재 여부 확인
     * 
     * 이미 90% 이상의 기본 기능이 제공되므로, 
     * 우리는 비즈니스 로직에 특화된 메서드만 추가로 정의하면 됩니다.
     */

    /*
     * ============================================================================
     * 메서드 이름 기반 쿼리 생성 (Query Methods)
     * ============================================================================
     * 
     * Spring Data JPA가 메서드 이름을 분석하여 자동으로 SQL을 생성합니다.
     * 이는 개발 생산성을 크게 향상시키는 Spring의 핵심 기능 중 하나입니다.
     */

    /**
     * 이메일로 사용자 조회
     * 
     * 실무에서 중요한 이유:
     * 이메일은 대부분의 애플리케이션에서 사용자 식별자로 사용됩니다.
     * 로그인, 비밀번호 재설정 등에서 필수적인 기능입니다.
     * 
     * Optional을 반환하는 이유:
     * 해당 이메일의 사용자가 존재하지 않을 수 있으므로,
     * null 대신 Optional을 사용하여 안전한 코드를 작성할 수 있습니다.
     * 
     * @param email 조회할 이메일 주소
     * @return 사용자 정보 (Optional로 감싸서)
     */
    Optional<User> findByEmail(String email);

    /**
     * 이메일 중복 확인
     * 
     * 회원가입이나 이메일 수정 시 중복을 방지하기 위해 사용됩니다.
     * boolean을 반환하므로 간단하고 명확합니다.
     * 
     * @param email 확인할 이메일 주소
     * @return 해당 이메일이 이미 존재하면 true, 그렇지 않으면 false
     */
    boolean existsByEmail(String email);

    /**
     * 활성 사용자만 조회
     * 
     * 실무에서 매우 중요한 기능:
     * 비활성화된 사용자는 목록에서 제외해야 하는 경우가 많습니다.
     * 예: 사용자 선택 드롭다운, 권한 부여 대상 선택 등
     * 
     * @return 활성 상태인 사용자들의 목록
     */
    List<User> findByActiveTrue();

    /**
     * 부서별 활성 사용자 조회
     * 
     * 복합 조건 쿼리의 예시입니다.
     * 메서드 이름이 길어지지만, SQL을 직접 작성하지 않아도 되는 장점이 있습니다.
     * 
     * @param department 부서명
     * @return 해당 부서의 활성 사용자들
     */
    List<User> findByDepartmentAndActiveTrue(String department);

    /**
     * 이름으로 사용자 검색 (대소문자 무시)
     * 
     * 사용자 인터페이스에서 검색 기능을 구현할 때 유용합니다.
     * ContainingIgnoreCase는 LIKE '%keyword%' 쿼리를 생성하며,
     * 대소문자를 구분하지 않고 부분 일치 검색을 수행합니다.
     * 
     * @param name 검색할 이름 (부분 검색 가능)
     * @return 이름에 해당 키워드가 포함된 사용자들
     */
    List<User> findByNameContainingIgnoreCase(String name);

    /*
     * ============================================================================
     * 커스텀 쿼리 (JPQL 사용)
     * ============================================================================
     * 
     * 메서드 이름만으로는 표현하기 어려운 복잡한 쿼리나
     * 성능 최적화가 필요한 경우 JPQL을 직접 작성할 수 있습니다.
     * 
     * JPQL의 장점:
     * 1. 데이터베이스에 독립적 (H2, MySQL, PostgreSQL 등에서 동일하게 작동)
     * 2. 엔티티 기반으로 작성하므로 타입 안정성 보장
     * 3. IDE에서 자동 완성과 문법 검사 지원
     */

    /**
     * 이름과 이메일을 동시에 검색
     * 
     * 사용자가 "홍길동" 또는 "hong@example.com"으로 검색했을 때
     * 두 필드 모두에서 검색 결과를 찾을 수 있도록 합니다.
     * 
     * 이런 기능이 실무에서 중요한 이유:
     * 사용자는 정확한 정보를 기억하지 못할 수 있습니다.
     * "김"이라고만 검색해도 "김철수", "kim@company.com" 등을
     * 모두 찾을 수 있어야 사용자 경험이 좋아집니다.
     * 
     * @param keyword 검색 키워드
     * @return 이름 또는 이메일에 키워드가 포함된 활성 사용자들
     */
    @Query("SELECT u FROM User u WHERE u.active = true AND " +
           "(UPPER(u.name) LIKE UPPER(CONCAT('%', :keyword, '%')) OR " +
           "UPPER(u.email) LIKE UPPER(CONCAT('%', :keyword, '%')))")
    List<User> searchByNameOrEmail(@Param("keyword") String keyword);

    /**
     * 부서별 사용자 통계
     * 
     * 관리자 대시보드나 리포트에서 유용한 정보입니다.
     * 단순히 개수만 세는 것이므로 데이터를 모두 가져올 필요가 없어서 성능상 유리합니다.
     * 
     * @param department 부서명
     * @return 해당 부서의 활성 사용자 수
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.department = :department AND u.active = true")
    long countActiveUsersByDepartment(@Param("department") String department);

    /**
     * 모든 부서명 조회 (중복 제거)
     * 
     * 부서 드롭다운 리스트나 필터 옵션을 만들 때 유용합니다.
     * DISTINCT를 사용하여 중복을 제거하고,
     * NULL이 아닌 값만 가져옵니다.
     * 
     * @return 시스템에 등록된 모든 부서명 목록
     */
    @Query("SELECT DISTINCT u.department FROM User u WHERE u.department IS NOT NULL AND u.department != '' ORDER BY u.department")
    List<String> findAllDepartments();

    /*
     * ============================================================================
     * 네이티브 쿼리 (Native Query)
     * ============================================================================
     * 
     * 특별한 경우에만 사용합니다. 예를 들어:
     * 1. 데이터베이스 특화 기능을 사용해야 하는 경우
     * 2. 복잡한 통계나 집계 쿼리가 필요한 경우
     * 3. 성능상 네이티브 SQL이 훨씬 빠른 경우
     * 
     * 하지만 네이티브 쿼리는 다음과 같은 단점이 있습니다:
     * - 데이터베이스에 종속적
     * - 타입 안정성이 떨어짐
     * - 엔티티 변경 시 수동으로 쿼리 수정 필요
     * 
     * 따라서 정말 필요한 경우에만 사용하는 것이 좋습니다.
     */

    /**
     * 사용자 이메일 도메인별 통계 (예: @company.com, @gmail.com 등)
     * 
     * 이런 통계는 JPQL로는 표현하기 어렵고,
     * 데이터베이스의 문자열 함수를 직접 사용하는 것이 더 효율적입니다.
     * 
     * @return 도메인별 사용자 수 (예: [["company.com", 15], ["gmail.com", 3]])
     */
    @Query(value = "SELECT SUBSTRING(email, POSITION('@' IN email) + 1) as domain, COUNT(*) as count " +
                   "FROM users WHERE active = true " +
                   "GROUP BY SUBSTRING(email, POSITION('@' IN email) + 1) " +
                   "ORDER BY count DESC",
           nativeQuery = true)
    List<Object[]> getEmailDomainStatistics();

    /*
     * ============================================================================
     * 실무 팁: 쿼리 성능 고려사항
     * ============================================================================
     * 
     * 1. 인덱스 활용:
     *    자주 검색되는 필드(예: email, department)에는 데이터베이스 인덱스를 설정하세요.
     *    @Index 애노테이션을 엔티티에 추가하거나 DDL로 직접 생성할 수 있습니다.
     * 
     * 2. 페이징 처리:
     *    대량의 데이터가 예상되는 경우 Pageable을 사용하세요.
     *    예: Page<User> findByActiveTrue(Pageable pageable);
     * 
     * 3. 지연 로딩 고려:
     *    연관 관계가 있는 엔티티는 필요할 때만 로드되도록 @ManyToOne(fetch = FetchType.LAZY) 사용
     * 
     * 4. 프로젝션 활용:
     *    전체 엔티티가 아닌 일부 필드만 필요한 경우 프로젝션을 사용하여 성능 향상
     *    예: List<String> findEmailByActiveTrue();
     * 
     * 이런 고려사항들이 실무에서 매우 중요한 이유:
     * 개발 초기에는 데이터가 적어서 성능 문제가 보이지 않지만,
     * 실제 운영 환경에서는 수만, 수십만 건의 데이터를 다뤄야 하기 때문입니다.
     * 
     * 마치 자동차를 설계할 때 연비를 고려하는 것과 같습니다.
     * 짧은 거리에서는 연비가 중요하지 않지만, 장거리 여행에서는 큰 차이를 만듭니다.
     */
}
