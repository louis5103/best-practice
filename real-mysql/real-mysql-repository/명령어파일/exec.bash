##### 컨테이너 내부로 접속
docker exec -it mysql-study bash

##### MySQL 로그 파일 확인
ls -la /var/log/mysql/
cat /var/log/mysql/error.log

##### 또는 MySQL 설정 확인
mysql -u root -p -e "SHOW VARIABLES LIKE '%log%';"

---

# 여러 터미널에서 동시에 모니터링
# 터미널 1: 에러 로그
docker exec mysql-study tail -f /var/log/mysql/error.log

# 터미널 2: 일반 로그 (쿼리 로그)
docker exec mysql-study tail -f /var/log/mysql/general.log

# 터미널 3: 슬로우 쿼리 로그
docker exec mysql-study tail -f /var/log/mysql/slow.log