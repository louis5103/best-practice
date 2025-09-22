package com.company.javafxdemo.service;

import com.company.javafxdemo.model.User;
import com.company.javafxdemo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

/**
 * 사용자 관련 비즈니스 로직을 담당하는 서비스
 * 
 * 기존 코드와의 중요한 개선사항들:
 * 
 * 1. 과도한 이벤트 시스템 제거:
 *    원래 코드에서는 ApplicationEventPublisher를 사용했지만,
 *    소규모 애플리케이션에서는 과도한 복잡성일 수 있습니다.
 *    정말 필요한 경우에만 이벤트 시스템을 도입하는 것이 좋습니다.
 * 
 * 2. 예외 처리 단순화:
 *    커스텀 BusinessException 대신 표준 예외를 사용합니다.
 *    이렇게 하면 Spring이 자동으로 처리해주는 기능들을 활용할 수 있습니다.
 * 
 * 3. 검증 로직 통합:
 *    별도의 ValidationService를 만들지 않고 여기서 직접 처리합니다.
 *    단순한 검증의 경우 분리하면 오히려 복잡해질 수 있습니다.
 * 
 * 이는 마치 요리할 때 모든 양념을 별도 용기에 나누어 놓는 것보다는
 * 자주 함께 사용하는 양념들을 한곳에 두는 것이 더 효율적인 것과 같습니다.
 * 
 * @author JavaFX Demo Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor  // final 필드들을 매개변수로 받는 생성자 자동 생성
@Slf4j  // 로깅을 위한 Logger 자동 생성
@Transactional(readOnly = true)  // 기본적으로 읽기 전용 트랜잭션 (성능 최적화)
public class UserService {

    private final UserRepository userRepository;

    /*
     * ============================================================================
     * 조회 작업들 (Read Operations)
     * ============================================================================
     * 
     * 읽기 전용 작업들은 @Transactional(readOnly = true)가 적용됩니다.
     * 이렇게 하면 데이터베이스 성능이 향상되고 의도치 않은 데이터 변경을 방지할 수 있습니다.
     */

    /**
     * 모든 활성 사용자 조회
     * 
     * 실무에서 중요한 고려사항:
     * 일반적으로 UI에서는 비활성화된 사용자를 보여주지 않습니다.
     * 따라서 기본적으로 활성 사용자만 반환하는 것이 좋습니다.
     * 
     * @return 활성 상태인 사용자 목록
     */
    public List<User> getAllActiveUsers() {
        log.debug("모든 활성 사용자 조회 요청");
        List<User> users = userRepository.findByActiveTrue();
        log.info("총 {}명의 활성 사용자를 조회했습니다", users.size());
        return users;
    }

    /**
     * 모든 사용자 조회 (관리자용)
     * 
     * 관리자 화면에서는 비활성화된 사용자도 볼 수 있어야 합니다.
     * 메서드 이름을 명확히 하여 용도를 구분합니다.
     * 
     * @return 모든 사용자 목록 (활성/비활성 포함)
     */
    public List<User> getAllUsers() {
        log.debug("모든 사용자 조회 요청 (관리자용)");
        return userRepository.findAll();
    }

    /**
     * ID로 사용자 조회
     * 
     * @param id 사용자 ID
     * @return 사용자 정보 (Optional로 감싸서)
     */
    public Optional<User> getUserById(Long id) {
        if (id == null) {
            log.warn("사용자 ID가 null입니다");
            return Optional.empty();
        }
        
        log.debug("사용자 조회 요청: ID = {}", id);
        return userRepository.findById(id);
    }

    /**
     * 이메일로 사용자 조회
     * 
     * @param email 이메일 주소
     * @return 사용자 정보 (Optional로 감싸서)
     */
    public Optional<User> getUserByEmail(String email) {
        if (!StringUtils.hasText(email)) {
            log.warn("이메일이 비어있습니다");
            return Optional.empty();
        }
        
        log.debug("사용자 조회 요청: email = {}", email);
        return userRepository.findByEmail(email.trim().toLowerCase());
    }

    /**
     * 부서별 사용자 조회
     * 
     * @param department 부서명
     * @return 해당 부서의 활성 사용자 목록
     */
    public List<User> getUsersByDepartment(String department) {
        if (!StringUtils.hasText(department)) {
            log.warn("부서명이 비어있습니다");
            return List.of();  // 빈 리스트 반환
        }
        
        log.debug("부서별 사용자 조회 요청: department = {}", department);
        return userRepository.findByDepartmentAndActiveTrue(department.trim());
    }

    /**
     * 사용자 검색
     * 
     * 이름이나 이메일로 검색할 수 있습니다.
     * UI의 검색 기능에서 사용됩니다.
     * 
     * @param keyword 검색 키워드
     * @return 검색 결과 사용자 목록
     */
    public List<User> searchUsers(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            log.debug("검색 키워드가 비어있어서 모든 활성 사용자를 반환합니다");
            return getAllActiveUsers();
        }
        
        String trimmedKeyword = keyword.trim();
        log.debug("사용자 검색 요청: keyword = {}", trimmedKeyword);
        
        List<User> results = userRepository.searchByNameOrEmail(trimmedKeyword);
        log.info("검색 결과: {}명의 사용자를 찾았습니다", results.size());
        
        return results;
    }

    /**
     * 모든 부서 목록 조회
     * 
     * UI에서 부서 선택 드롭다운을 만들 때 사용됩니다.
     * 
     * @return 시스템에 등록된 모든 부서명 목록
     */
    public List<String> getAllDepartments() {
        log.debug("모든 부서 목록 조회 요청");
        return userRepository.findAllDepartments();
    }

    /*
     * ============================================================================
     * 변경 작업들 (Write Operations)
     * ============================================================================
     * 
     * 데이터를 변경하는 작업들은 명시적으로 @Transactional을 선언합니다.
     * 이렇게 하면 작업 중 예외가 발생할 때 자동으로 롤백됩니다.
     */

    /**
     * 새로운 사용자 생성
     * 
     * 기존 코드와의 차이점:
     * 1. 복잡한 이벤트 발행 제거
     * 2. 검증 로직을 별도 서비스로 분리하지 않고 여기서 처리
     * 3. 예외 처리 단순화
     * 
     * @param user 생성할 사용자 정보
     * @return 생성된 사용자 정보
     * @throws IllegalArgumentException 유효하지 않은 데이터인 경우
     */
    @Transactional
    public User createUser(User user) {
        // 입력 데이터 검증 (null 체크 포함) - 가장 먼저 수행해야 함
        validateUserForCreation(user);
        
        log.info("새로운 사용자 생성 시도: {}", user.getEmail());
        
        // 이메일 중복 확인
        if (userRepository.existsByEmail(user.getEmail().toLowerCase())) {
            String errorMsg = "이미 사용 중인 이메일입니다: " + user.getEmail();
            log.warn(errorMsg);
            throw new IllegalArgumentException(errorMsg);
        }
        
        // 데이터 정규화
        normalizeUserData(user);
        
        // 저장
        User savedUser = userRepository.save(user);
        log.info("사용자가 성공적으로 생성되었습니다: ID = {}, Email = {}", 
                savedUser.getId(), savedUser.getEmail());
        
        return savedUser;
    }

    /**
     * 사용자 정보 수정
     * 
     * @param user 수정할 사용자 정보 (ID 포함)
     * @return 수정된 사용자 정보
     * @throws IllegalArgumentException 유효하지 않은 데이터이거나 사용자를 찾을 수 없는 경우
     */
    @Transactional
    public User updateUser(User user) {
        if (user.getId() == null) {
            throw new IllegalArgumentException("수정할 사용자의 ID가 필요합니다");
        }
        
        log.info("사용자 정보 수정 시도: ID = {}", user.getId());
        
        // 기존 사용자 존재 여부 확인
        User existingUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + user.getId()));
        
        // 입력 데이터 검증
        validateUserForUpdate(user, existingUser);
        
        // 이메일 변경 시 중복 확인
        if (!existingUser.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(user.getEmail().toLowerCase())) {
                String errorMsg = "이미 사용 중인 이메일입니다: " + user.getEmail();
                log.warn(errorMsg);
                throw new IllegalArgumentException(errorMsg);
            }
        }
        
        // 데이터 정규화
        normalizeUserData(user);
        
        // 수정 (JPA가 자동으로 변경 감지하여 UPDATE 실행)
        existingUser.setName(user.getName());
        existingUser.setEmail(user.getEmail());
        existingUser.setPhone(user.getPhone());
        existingUser.setDepartment(user.getDepartment());
        
        User updatedUser = userRepository.save(existingUser);
        log.info("사용자 정보가 성공적으로 수정되었습니다: ID = {}", updatedUser.getId());
        
        return updatedUser;
    }

    /**
     * 사용자 비활성화
     * 
     * 실제 삭제 대신 비활성화하는 이유:
     * 1. 데이터 무결성 유지 (다른 데이터에서 참조할 수 있음)
     * 2. 감사 목적 (누가 언제 어떤 작업을 했는지 추적 가능)
     * 3. 실수로 삭제했을 때 복구 가능
     * 
     * @param id 비활성화할 사용자 ID
     * @throws IllegalArgumentException 사용자를 찾을 수 없는 경우
     */
    @Transactional
    public void deactivateUser(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("사용자 ID가 필요합니다");
        }
        
        log.info("사용자 비활성화 시도: ID = {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + id));
        
        user.deactivate();
        userRepository.save(user);
        
        log.info("사용자가 성공적으로 비활성화되었습니다: ID = {}, Email = {}", 
                user.getId(), user.getEmail());
    }

    /**
     * 사용자 활성화
     * 
     * 비활성화된 사용자를 다시 활성화할 때 사용합니다.
     * 
     * @param id 활성화할 사용자 ID
     * @throws IllegalArgumentException 사용자를 찾을 수 없는 경우
     */
    @Transactional
    public void activateUser(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("사용자 ID가 필요합니다");
        }
        
        log.info("사용자 활성화 시도: ID = {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + id));
        
        user.activate();
        userRepository.save(user);
        
        log.info("사용자가 성공적으로 활성화되었습니다: ID = {}, Email = {}", 
                user.getId(), user.getEmail());
    }

    /*
     * ============================================================================
     * 유틸리티 및 검증 메서드들
     * ============================================================================
     * 
     * 이 메서드들은 서비스 내부에서만 사용되므로 private으로 선언합니다.
     * 별도의 ValidationService를 만들지 않고 여기서 처리하는 이유는
     * 검증 로직이 복잡하지 않고, 사용자 도메인에 특화되어 있기 때문입니다.
     */

    /**
     * 새로운 사용자 생성 시 검증
     * 
     * @param user 검증할 사용자 정보
     * @throws IllegalArgumentException 유효하지 않은 데이터인 경우
     */
    private void validateUserForCreation(User user) {
        if (user == null) {
            throw new IllegalArgumentException("사용자 정보가 필요합니다");
        }
        
        validateBasicUserData(user);
    }

    /**
     * 사용자 수정 시 검증
     * 
     * @param user 수정할 사용자 정보
     * @param existingUser 기존 사용자 정보
     * @throws IllegalArgumentException 유효하지 않은 데이터인 경우
     */
    private void validateUserForUpdate(User user, User existingUser) {
        validateBasicUserData(user);
        
        // 수정 관련 추가 검증 로직이 필요하다면 여기에 추가
    }

    /**
     * 기본 사용자 데이터 검증
     * 
     * @param user 검증할 사용자 정보
     * @throws IllegalArgumentException 유효하지 않은 데이터인 경우
     */
    private void validateBasicUserData(User user) {
        // 이름 검증
        if (!StringUtils.hasText(user.getName())) {
            throw new IllegalArgumentException("이름은 필수입니다");
        }
        
        if (user.getName().trim().length() > 100) {
            throw new IllegalArgumentException("이름은 100자 이하여야 합니다");
        }
        
        // 이메일 검증
        if (!StringUtils.hasText(user.getEmail())) {
            throw new IllegalArgumentException("이메일은 필수입니다");
        }
        
        if (!user.isValidEmail()) {
            throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다: " + user.getEmail());
        }
        
        // 전화번호 검증 (선택적)
        if (StringUtils.hasText(user.getPhone()) && user.getPhone().length() > 20) {
            throw new IllegalArgumentException("전화번호는 20자 이하여야 합니다");
        }
        
        // 부서명 검증 (선택적)
        if (StringUtils.hasText(user.getDepartment()) && user.getDepartment().length() > 100) {
            throw new IllegalArgumentException("부서명은 100자 이하여야 합니다");
        }
    }

    /**
     * 사용자 데이터 정규화
     * 
     * 저장하기 전에 데이터를 일관된 형태로 변환합니다.
     * 예: 이메일 소문자 변환, 앞뒤 공백 제거 등
     * 
     * @param user 정규화할 사용자 정보
     */
    private void normalizeUserData(User user) {
        // 이름: 앞뒤 공백 제거
        if (StringUtils.hasText(user.getName())) {
            user.setName(user.getName().trim());
        }
        
        // 이메일: 소문자 변환 및 앞뒤 공백 제거
        if (StringUtils.hasText(user.getEmail())) {
            user.setEmail(user.getEmail().trim().toLowerCase());
        }
        
        // 전화번호: 앞뒤 공백 제거
        if (StringUtils.hasText(user.getPhone())) {
            user.setPhone(user.getPhone().trim());
        }
        
        // 부서: 앞뒤 공백 제거
        if (StringUtils.hasText(user.getDepartment())) {
            user.setDepartment(user.getDepartment().trim());
        }
    }

    /*
     * ============================================================================
     * 통계 및 분석 메서드들
     * ============================================================================
     * 
     * 관리자 대시보드나 리포트에서 사용할 수 있는 통계 정보를 제공합니다.
     */

    /**
     * 전체 사용자 수 조회
     * 
     * @return 전체 사용자 수 (활성/비활성 포함)
     */
    public long getTotalUserCount() {
        return userRepository.count();
    }

    /**
     * 활성 사용자 수 조회
     * 
     * @return 활성 사용자 수
     */
    public long getActiveUserCount() {
        return userRepository.findByActiveTrue().size();
    }

    /**
     * 부서별 사용자 수 조회
     * 
     * @param department 부서명
     * @return 해당 부서의 활성 사용자 수
     */
    public long getUserCountByDepartment(String department) {
        if (!StringUtils.hasText(department)) {
            return 0;
        }
        return userRepository.countActiveUsersByDepartment(department.trim());
    }
}
