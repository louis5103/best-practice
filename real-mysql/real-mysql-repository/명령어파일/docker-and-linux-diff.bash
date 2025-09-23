# MySQL 서비스 관리 명령어 비교

# ==========================================
# 서비스 시작/중지/재시작
# ==========================================

# 로컬 MySQL 서비스 관리
systemctl start mysqld      # MySQL 시작
systemctl stop mysqld       # MySQL 중지
systemctl restart mysqld    # MySQL 재시작
systemctl status mysqld     # 상태 확인

# Docker MySQL 관리
docker-compose up -d        # MySQL 컨테이너 시작 (백그라운드)
docker-compose down         # MySQL 컨테이너 중지 및 삭제
docker-compose restart     # MySQL 컨테이너 재시작
docker-compose ps          # 컨테이너 상태 확인

# ==========================================
# 로그 확인
# ==========================================

# 로컬 MySQL 로그
tail -f /var/log/mysqld.log
journalctl -u mysqld -f    # systemd 로그
journalctl -u mysqld --since "1 hour ago"

# Docker MySQL 로그
docker logs -f mysql-study              # 컨테이너 로그
docker exec mysql-study tail -f /var/log/mysql/error.log
docker-compose logs -f                  # docker-compose 로그

# ==========================================
# 설정 관리
# ==========================================

# 로컬 MySQL 설정
vim /etc/my.cnf             # 설정 파일 편집
systemctl reload mysqld     # 설정 다시 읽기

# Docker MySQL 설정
vim ./mysql-config/my.cnf   # 호스트에서 설정 편집
docker-compose restart     # 컨테이너 재시작으로 설정 적용
# 또는
docker exec mysql-study mysqladmin -u root -p reload

# ==========================================
# 프로세스 확인
# ==========================================

# 로컬 MySQL 프로세스
ps aux | grep mysqld
netstat -tlnp | grep 3306

# Docker MySQL 프로세스
docker ps | grep mysql
docker exec mysql-study ps aux | grep mysql
docker port mysql-study

# ==========================================
# 자동 시작 설정
# ==========================================

# 로컬 MySQL 자동 시작
systemctl enable mysqld     # 부팅시 자동 시작
systemctl disable mysqld    # 자동 시작 해제

# Docker MySQL 자동 시작 (docker-compose.yml에 설정)
# restart: always           # 항상 재시작
# restart: unless-stopped   # 수동 중지 외에는 재시작
# restart: on-failure       # 실패시만 재시작