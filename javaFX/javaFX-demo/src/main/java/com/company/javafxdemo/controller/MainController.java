package com.company.javafxdemo.controller;

import com.company.javafxdemo.model.User;
import com.company.javafxdemo.service.UserService;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.List;
import java.util.Optional;
import java.util.ResourceBundle;

/**
 * 메인 화면의 사용자 관리 컨트롤러
 * 
 * 기존 코드와의 중요한 개선사항들:
 * 
 * 1. FXWeaver 제거:
 *    외부 라이브러리 의존성을 제거하고 Spring의 기본 기능만 사용합니다.
 *    @Component 애노테이션과 커스텀 컨트롤러 팩토리를 통해 의존성 주입을 구현합니다.
 * 
 * 2. 복잡한 이벤트 처리 단순화:
 *    Spring 이벤트 시스템 대신 직접적인 메서드 호출을 사용합니다.
 *    이렇게 하면 코드가 더 명확하고 디버깅하기 쉬워집니다.
 * 
 * 3. UI 로직에만 집중:
 *    컨트롤러는 사용자 인터랙션 처리와 화면 업데이트에만 집중합니다.
 *    비즈니스 로직은 모두 서비스 레이어에 위임합니다.
 * 
 * 이는 마치 레스토랑에서 웨이터가 주문 받기와 서빙에만 집중하고,
 * 요리는 요리사에게 맡기는 것과 같은 역할 분담입니다.
 * 
 * @author JavaFX Demo Team
 * @version 1.0
 */
@Component  // Spring이 이 클래스를 빈으로 관리하도록 지시
@RequiredArgsConstructor  // final 필드들을 매개변수로 받는 생성자 자동 생성
@Slf4j  // 로깅을 위한 Logger 자동 생성
public class MainController implements Initializable {

    /*
     * ============================================================================
     * Spring 의존성 주입
     * ============================================================================
     * 
     * 생성자 주입을 사용하는 이유:
     * 1. 불변성 보장 (final 키워드 사용 가능)
     * 2. 테스트하기 쉬움 (Mock 객체 주입이 용이)
     * 3. 순환 의존성 감지 가능
     * 4. Spring에서 권장하는 방식
     */
    private final UserService userService;

    /*
     * ============================================================================
     * FXML과 연결되는 UI 컴포넌트들
     * ============================================================================
     * 
     * @FXML 애노테이션은 FXML 파일의 fx:id와 매칭되는 필드들에 사용됩니다.
     * FXML 로더가 파일을 읽을 때 자동으로 이 필드들에 객체를 주입합니다.
     * 
     * 주의사항: 필드명과 FXML의 fx:id가 정확히 일치해야 합니다.
     */
    
    // 사용자 목록 테이블
    @FXML private TableView<User> userTable;
    @FXML private TableColumn<User, String> nameColumn;
    @FXML private TableColumn<User, String> emailColumn;
    @FXML private TableColumn<User, String> departmentColumn;
    @FXML private TableColumn<User, String> phoneColumn;
    
    // 입력 폼 요소들
    @FXML private TextField nameField;
    @FXML private TextField emailField;
    @FXML private TextField phoneField;
    @FXML private ComboBox<String> departmentComboBox;
    
    // 버튼들
    @FXML private Button addButton;
    @FXML private Button updateButton;
    @FXML private Button deleteButton;
    @FXML private Button clearButton;
    
    // 검색 관련
    @FXML private TextField searchField;
    @FXML private Button searchButton;
    
    // 상태 표시
    @FXML private Label statusLabel;
    @FXML private Label totalCountLabel;

    /*
     * ============================================================================
     * 데이터 관리
     * ============================================================================
     * 
     * ObservableList를 사용하는 이유:
     * 데이터가 변경될 때 자동으로 UI가 업데이트됩니다.
     * 마치 스프레드시트에서 데이터를 수정하면 차트가 자동으로 업데이트되는 것과 같습니다.
     */
    private ObservableList<User> userList = FXCollections.observableArrayList();
    private User selectedUser = null;  // 현재 선택된 사용자

    /**
     * JavaFX 컨트롤러 초기화 메서드
     * 
     * 이 메서드는 FXML 파일이 로드되고 모든 @FXML 필드들이 주입된 후에 호출됩니다.
     * 따라서 여기서 UI 구성 요소들을 안전하게 설정할 수 있습니다.
     * 
     * 실행 순서:
     * 1. FXML 파일 로드
     * 2. @FXML 필드들에 객체 주입
     * 3. initialize() 메서드 호출
     * 
     * @param location FXML 파일의 위치 (사용하지 않음)
     * @param resources 리소스 번들 (사용하지 않음)
     */
    @Override
    public void initialize(URL location, ResourceBundle resources) {
        log.info("MainController 초기화 시작");
        
        try {
            setupTableColumns();
            setupEventHandlers();
            setupValidation();
            loadInitialData();
            updateUI();
            
            log.info("MainController 초기화 완료");
            
        } catch (Exception e) {
            log.error("MainController 초기화 중 오류 발생", e);
            showErrorMessage("초기화 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 테이블 컬럼 설정
     * 
     * PropertyValueFactory를 사용하면 User 객체의 필드와 자동으로 매핑됩니다.
     * 예: "name"을 지정하면 User.getName() 메서드를 자동으로 호출합니다.
     */
    private void setupTableColumns() {
        // 각 컬럼을 User 객체의 속성과 연결
        nameColumn.setCellValueFactory(new PropertyValueFactory<>("name"));
        emailColumn.setCellValueFactory(new PropertyValueFactory<>("email"));
        departmentColumn.setCellValueFactory(new PropertyValueFactory<>("department"));
        phoneColumn.setCellValueFactory(new PropertyValueFactory<>("phone"));
        
        // 테이블에 데이터 바인딩
        userTable.setItems(userList);
        
        // 테이블 선택 이벤트 설정
        userTable.getSelectionModel().selectedItemProperty().addListener(
            (observable, oldValue, newValue) -> handleUserSelection(newValue)
        );
        
        // 컬럼 너비 자동 조정
        userTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        
        log.debug("테이블 컬럼 설정 완료");
    }

    /**
     * 이벤트 핸들러 설정
     * 
     * 각 UI 컴포넌트의 이벤트 처리를 설정합니다.
     * 람다 표현식을 사용하여 간결하게 작성합니다.
     */
    private void setupEventHandlers() {
        // 버튼 이벤트들
        addButton.setOnAction(e -> handleAddUser());
        updateButton.setOnAction(e -> handleUpdateUser());
        deleteButton.setOnAction(e -> handleDeleteUser());
        clearButton.setOnAction(e -> handleClearForm());
        
        // 검색 관련 이벤트
        searchButton.setOnAction(e -> handleSearch());
        searchField.setOnAction(e -> handleSearch());  // Enter 키 지원
        
        // 실시간 검색 (입력할 때마다 검색)
        searchField.textProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue.length() > 2 || newValue.isEmpty()) {
                handleSearch();
            }
        });
        
        log.debug("이벤트 핸들러 설정 완료");
    }

    /**
     * 입력 검증 설정
     * 
     * 사용자가 올바르지 않은 데이터를 입력했을 때의 처리를 설정합니다.
     * 실시간 피드백을 제공하여 사용자 경험을 향상시킵니다.
     */
    private void setupValidation() {
        // 버튼 활성화/비활성화 로직
        // 필요한 필드가 모두 입력되었을 때만 추가/수정 버튼 활성화
        javafx.beans.binding.BooleanBinding fieldsNotEmpty = 
            nameField.textProperty().isEmpty()
            .or(emailField.textProperty().isEmpty());
        
        addButton.disableProperty().bind(fieldsNotEmpty);
        
        // 사용자가 선택되었을 때만 수정/삭제 버튼 활성화
        updateButton.setDisable(true);
        deleteButton.setDisable(true);
        
        log.debug("입력 검증 설정 완료");
    }

    /**
     * 초기 데이터 로딩
     * 
     * 애플리케이션 시작 시 서비스에서 데이터를 가져와서 화면에 표시합니다.
     */
    private void loadInitialData() {
        try {
            // 사용자 목록 로드
            List<User> users = userService.getAllActiveUsers();
            userList.setAll(users);
            
            // 부서 목록 로드
            List<String> departments = userService.getAllDepartments();
            departmentComboBox.getItems().setAll(departments);
            
            log.info("초기 데이터 로딩 완료: 사용자 {}명, 부서 {}개", 
                    users.size(), departments.size());
            
        } catch (Exception e) {
            log.error("초기 데이터 로딩 중 오류 발생", e);
            showErrorMessage("데이터를 불러오는 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /*
     * ============================================================================
     * 이벤트 핸들러 메서드들
     * ============================================================================
     * 
     * 각 사용자 액션에 대응하는 메서드들입니다.
     * 메서드명을 handle...로 시작하여 이벤트 처리 메서드임을 명확히 합니다.
     */

    /**
     * 사용자 선택 처리
     * 
     * 테이블에서 사용자를 선택했을 때 호출됩니다.
     * 선택된 사용자의 정보를 입력 폼에 표시합니다.
     * 
     * @param user 선택된 사용자 (null일 수 있음)
     */
    private void handleUserSelection(User user) {
        this.selectedUser = user;
        
        if (user != null) {
            // 선택된 사용자 정보를 폼에 표시
            nameField.setText(user.getName());
            emailField.setText(user.getEmail());
            phoneField.setText(user.getPhone());
            departmentComboBox.setValue(user.getDepartment());
            
            // 수정/삭제 버튼 활성화
            updateButton.setDisable(false);
            deleteButton.setDisable(false);
            
            log.debug("사용자 선택됨: {}", user.getEmail());
            
        } else {
            // 선택 해제
            updateButton.setDisable(true);
            deleteButton.setDisable(true);
            
            log.debug("사용자 선택 해제됨");
        }
    }

    /**
     * 새로운 사용자 추가
     */
    private void handleAddUser() {
        try {
            // 입력 폼에서 데이터 수집
            User newUser = User.builder()
                    .name(nameField.getText().trim())
                    .email(emailField.getText().trim())
                    .phone(phoneField.getText().trim())
                    .department(departmentComboBox.getValue())
                    .build();
            
            // 서비스를 통해 사용자 생성
            User savedUser = userService.createUser(newUser);
            
            // UI 업데이트
            userList.add(savedUser);
            clearForm();
            showSuccessMessage("사용자가 성공적으로 추가되었습니다.");
            
            log.info("새로운 사용자 추가됨: {}", savedUser.getEmail());
            
        } catch (Exception e) {
            log.error("사용자 추가 중 오류 발생", e);
            showErrorMessage("사용자 추가 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        updateUI();
    }

    /**
     * 선택된 사용자 정보 수정
     */
    private void handleUpdateUser() {
        if (selectedUser == null) {
            showWarningMessage("수정할 사용자를 선택해주세요.");
            return;
        }
        
        try {
            // 선택된 사용자의 정보를 폼 데이터로 업데이트
            selectedUser.setName(nameField.getText().trim());
            selectedUser.setEmail(emailField.getText().trim());
            selectedUser.setPhone(phoneField.getText().trim());
            selectedUser.setDepartment(departmentComboBox.getValue());
            
            // 서비스를 통해 업데이트
            User updatedUser = userService.updateUser(selectedUser);
            
            // UI 업데이트
            int index = userList.indexOf(selectedUser);
            if (index >= 0) {
                userList.set(index, updatedUser);
            }
            
            clearForm();
            showSuccessMessage("사용자 정보가 성공적으로 수정되었습니다.");
            
            log.info("사용자 정보 수정됨: {}", updatedUser.getEmail());
            
        } catch (Exception e) {
            log.error("사용자 수정 중 오류 발생", e);
            showErrorMessage("사용자 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        updateUI();
    }

    /**
     * 선택된 사용자 삭제 (실제로는 비활성화)
     */
    private void handleDeleteUser() {
        if (selectedUser == null) {
            showWarningMessage("삭제할 사용자를 선택해주세요.");
            return;
        }
        
        // 사용자 확인
        Alert confirmAlert = new Alert(Alert.AlertType.CONFIRMATION);
        confirmAlert.setTitle("사용자 삭제 확인");
        confirmAlert.setHeaderText("사용자를 삭제하시겠습니까?");
        confirmAlert.setContentText(selectedUser.getName() + " (" + selectedUser.getEmail() + ")");
        
        Optional<ButtonType> result = confirmAlert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            try {
                // 서비스를 통해 비활성화 (실제 삭제가 아님)
                userService.deactivateUser(selectedUser.getId());
                
                // UI에서 제거
                userList.remove(selectedUser);
                clearForm();
                showSuccessMessage("사용자가 성공적으로 삭제되었습니다.");
                
                log.info("사용자 비활성화됨: {}", selectedUser.getEmail());
                
            } catch (Exception e) {
                log.error("사용자 삭제 중 오류 발생", e);
                showErrorMessage("사용자 삭제 중 오류가 발생했습니다: " + e.getMessage());
            }
        }
        
        updateUI();
    }

    /**
     * 입력 폼 초기화
     */
    private void handleClearForm() {
        clearForm();
        showInfoMessage("입력 폼이 초기화되었습니다.");
    }

    /**
     * 사용자 검색
     */
    private void handleSearch() {
        try {
            String keyword = searchField.getText().trim();
            List<User> searchResults;
            
            if (keyword.isEmpty()) {
                // 검색어가 없으면 전체 목록 표시
                searchResults = userService.getAllActiveUsers();
            } else {
                // 검색 실행
                searchResults = userService.searchUsers(keyword);
            }
            
            userList.setAll(searchResults);
            showInfoMessage("검색 결과: " + searchResults.size() + "명");
            
            log.debug("검색 실행: 키워드='{}', 결과={}명", keyword, searchResults.size());
            
        } catch (Exception e) {
            log.error("검색 중 오류 발생", e);
            showErrorMessage("검색 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        updateUI();
    }

    /*
     * ============================================================================
     * 유틸리티 메서드들
     * ============================================================================
     */

    /**
     * 입력 폼 초기화
     */
    private void clearForm() {
        nameField.clear();
        emailField.clear();
        phoneField.clear();
        departmentComboBox.setValue(null);
        selectedUser = null;
        userTable.getSelectionModel().clearSelection();
        
        updateButton.setDisable(true);
        deleteButton.setDisable(true);
    }

    /**
     * UI 상태 업데이트
     */
    private void updateUI() {
        // 총 사용자 수 업데이트
        Platform.runLater(() -> {
            totalCountLabel.setText("총 " + userList.size() + "명");
        });
    }

    /*
     * ============================================================================
     * 메시지 표시 메서드들
     * ============================================================================
     * 
     * 사용자에게 다양한 상태 메시지를 표시하는 메서드들입니다.
     * 일관된 방식으로 메시지를 표시하여 사용자 경험을 향상시킵니다.
     */

    private void showSuccessMessage(String message) {
        statusLabel.setText(message);
        statusLabel.setStyle("-fx-text-fill: green;");
        clearStatusAfterDelay();
    }

    private void showErrorMessage(String message) {
        statusLabel.setText(message);
        statusLabel.setStyle("-fx-text-fill: red;");
        clearStatusAfterDelay();
    }

    private void showWarningMessage(String message) {
        statusLabel.setText(message);
        statusLabel.setStyle("-fx-text-fill: orange;");
        clearStatusAfterDelay();
    }

    private void showInfoMessage(String message) {
        statusLabel.setText(message);
        statusLabel.setStyle("-fx-text-fill: blue;");
        clearStatusAfterDelay();
    }

    /**
     * 일정 시간 후 상태 메시지 자동 삭제
     */
    private void clearStatusAfterDelay() {
        // 3초 후 메시지 삭제
        javafx.animation.Timeline timeline = new javafx.animation.Timeline(
            new javafx.animation.KeyFrame(
                javafx.util.Duration.seconds(3),
                e -> statusLabel.setText("")
            )
        );
        timeline.play();
    }
}
