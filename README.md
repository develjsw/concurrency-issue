### 동시성 이슈 ( concurrency-issue )

- 동시성 이슈란 ?
  - 여러 트랜잭션이나 프로세스가 동시에 같은 데이터에 접근 및 변경하려 할 때 발생하는 데이터 불일치 또는 충돌 문제를 의미함
    - EX.1) 좌석 예매 시스템에서 A01번 자리를 서로 다른 2명의 사람이 동시에 예매하려고 하는 경우 발생
    - EX.2) 상품의 재고가 1개 남은 상황에서 3명의 사람이 동시에 구매하려고 하는 경우 발생


- 동시성 이슈를 해결하기 위한 대표방법 3가지
  - [ DB에서 해결하는 방법 ]
    - `낙관적 락` ( Optimistic Lock ) : 데이터 충돌이 드물다고 가정하고, 트랜잭션이 데이터를 수정하기 전에 버전(Version) 번호나 TimeStamp를 확인하여 충돌을 감지하는 방식
      - 동작 방식
        - 트랜잭션을 시작하고 SELECT로 데이터를 조회한 후, Version 또는 TimeStamp 값을 가져옴
        - UPDATE 쿼리 실행시 위에서 조회해 온 Version 또는 TimeStamp 값을 조건으로 포함하여 실행
        - 업데이트 성공 여부 확인
          - 성공 : 1 rows affected (=영향받은 행이 1개 이상인 경우) → 정상적으로 COMMIT
          - 실패 : 0 rows affected (=영향받은 행이 0개인 경우) → 낙관적 락 충돌 발생
        - 충돌 발생 시 재시도 또는 RollBack 진행
          - 최신 데이터를 다시 SELECT하고 UPDATE를 다시 시도
          - 충돌 예외를 발생시켜 클라이언트에 알림
      - 쿼리 예시
        - transaction1 :
          ~~~
          $ START TRANSACTION;
          $ SELECT * FROM test.goods WHERE goods_id = 2; # version = 1임을 확인
          $ UPDATE test.goods SET goods_price = 1111, VERSION = VERSION + 1 WHERE goods_id = 2 AND VERSION = 1; # transaction1의 위에서 가져온 version 조건을 포함하여 업데이트
          ~~~
        - transaction2 :
          ~~~
          $ START TRANSACTION;
          $ SELECT * FROM test.goods WHERE goods_id = 2; # transaction1에서 commit하지 않았기 때문에 그대로 version = 1임을 확인
          ~~~
        - transaction1 :
          ~~~
          $ COMMIT; # transaction1 쿼리실행 종료 및 반영
          ~~~
        - transaction2 :
          ~~~
          $ UPDATE test.goods SET goods_price = 1111, VERSION = VERSION + 1 WHERE goods_id = 2 AND VERSION = 1; # transaction2의 위에서 가져온 version 조건을 포함하여 업데이트 (transaction2에서 가져왔던 version과 현재 update에서 조건으로 걸어둔 version의 차이로 인해 업데이트 된 행이 없음 = 0 rows affected)
          $ ROLLBACK; # 변경된 사항이 없으므로 RollBack 진행
          ~~~
      - Lost Update 이슈와 해결 방법
        - 위에서 살펴본 바와 같이 transaction2의 마지막 UPDATE 단계에서 수정 요청사항을 잃어버리게 됨
        - 따라서 낙관적 락에서는 RollBack을 진행한 후 클라이언트에 알리거나, 재시도 로직을 별도로 구현해야 함
    - `비관적 락` ( Pessimistic Lock ) : 데이터 충돌이 자주 발생할 것으로 예상될 때 사용하는 방식으로, 한 트랜잭션이 데이터를 수정하는 동안 다른 트랜잭션이 해당 데이터를 접근하지 못하도록 차단(locking)함
      - 동작 방식
        - 데이터를 조회할 때 잠금(Lock)을 설정하여 다른 트랜잭션이 해당 데이터를 변경할 수 없도록 함
        - 해당 트랜잭션이 종료될 때까지 다른 트랜잭션은 블록되거나 대기 상태가 됨
        - 트랜잭션이 완료되면 잠금이 해제됨
        - 이때, UPDATE에 대한 Lock만 진행되는 것이므로 다른 트랜잭션에서 SELECT/INSERT는 자유롭게 사용이 가능함
      - 쿼리 예시
        - transaction1 :
          ~~~
          $ START TRANSACTION;
          $ SELECT * FROM orm.goods WHERE goods_id = 2 FOR UPDATE; # UPDATE LOCK 생성
          $ UPDATE orm.goods SET goods_price = 1111; # 현재 transaction1 내에서 값 변경 완료
          ~~~
        - transaction2 :
          ~~~
          $ SELECT * FROM orm.goods WHERE goods_id = 2; # transaction1에서 commit하지 않았기 때문에 원래 값 보여짐 
          $ START TRANSACTION;
          $ UPDATE orm.goods SET goods_price = 2222 WHERE goods_id = 2; # 실행되지 않고 대기상태
          ~~~
        - transaction3 :
          ~~~
          # 쿼리 전체 정상 동작 #
          $ START TRANSACTION;
          $ SELECT * FROM orm.goods WHERE goods_id = 3;
          $ INSERT orm.goods (goods_name, goods_price, created_at) VALUES ('상품명4', 4444, NOW());
          $ COMMIT;
          ~~~
        - transaction1 :
          ~~~
          $ COMMIT; # transaction1 쿼리실행 종료 및 반영
          ~~~
        - transaction2 :
          ~~~
          $ COMMIT; # transaction2 쿼리실행 종료 및 반영(transaction2의 값으로 덮어 씌워지는 ★Lost Update 이슈 발생★, 너무 오랜시간 COMMIT을 하지 못하는 경우에는 LOCK TimeOut 시간이 초과되어 발생하지 않음)
          ~~~

      - Lost Update 이슈와 해결 방법
        - 위에서 살펴본 바와 같이 transaction2의 마지막 COMMIT 단계에서 transaction1에서 처리되었던 수정부분이 덮어씌워지는 이슈가 발생할 수 있음
        - 따라서 낙관적 락과 함께 사용하여 이를 해소시키는 방향으로 설계되어야 함


  - [ Redis를 활용한 방법 ]
    - `Redis 분산락` ( Distributed Lock ) : 멀티 인스턴스 환경에서 동시성을 제어하는 방법으로, 보통 SETNX (SET if Not Exists) 명령어를 이용하여 특정 리소스(데이터)를 다른 프로세스가 접근하지 못하도록 막아 데이터 충돌을 방지하는 방식
      - 동작 방식
        - Lock 획득 시도 :
          - 트랜잭션이 특정 리소스를 수정하기 전에 Redis의 SETNX 명령어를 통해 Lock을 생성함
          - `과반수 노드 확보 필요성` : Redis Cluster 환경에서 분산락을 구현할 경우, 과반수 이상의 노드에서 Lock을 성공적으로 획득해야 작업진행 가능. 이를 통해 단일 노드 장애에도 시스템의 안정성을 유지할 수 있음
            ~~~
            - EX-1) Redis1, Redis2, Redis3 중에서 2개 이상 Lock을 획득해야 수정 작업 진행 가능
            - EX-2) Redis1, Redis2, Redis3, Redis4 중에서 3개 이상 Lock을 획득해야 수정 작업 진행 가능
            - EX-3) Redis1, Redis2, Redis3, Redis4 중에서 2개 이상의 노드에 문제가 발생한 경우, 과반을 넘을 수 없기 때문에 Lock 획득 불가능하여 작업 진행 불가 
            ~~~
          - SETNX 명령어가 성공했을 경우에만 Lock을 획득한 것으로 간주하고, 실패한 경우에는 일정 시간 후 재시도 로직을 수행함
        - Lock 유지 및 만료 시간 설정 :
          - Lock 획득 시 일정 시간 후에 자동으로 Lock이 해제되도록 EXPIRE 명령어를 사용해 만료 시간을 설정함
          - Redis의 SET 명령어를 NX(Not Exists), EX(Expire) 옵션과 함께 사용하여 원자적으로 Lock을 생성하고 만료 시간을 설정할 수 있음
            - NX : Lock이 존재하지 않는 경우에만 생성
            - EX <ttl> : Lock 만료 시간 설정
          - Lock의 만료 시간을 설정함으로써 작업이 일정 시간 안에 완료되지 않을 경우 자동으로 Lock이 해제되도록 하여 Deadlock 방지 
        - Lock 해제 :
          - 작업 완료 후에는 DEL 명령어를 사용해 Lock을 해제함
          - Lock 해제를 통해 다른 프로세스가 해당 리소스를 수정할 수 있도록 함
      - 소스코드 예시 ( ** 레포지토리에 작성한 코드로 대체 ** )
      - Redis 분산락의 장점
        - 고성능: Redis는 메모리 기반으로 작동하기 때문에 Lock 획득 및 해제 속도가 빠름
        - 분산 환경 지원: 여러 인스턴스에서 동시성 문제를 방지할 수 있음
        - 유연성: Lock 유지 시간 및 만료 시간 설정이 가능함
      - Redis 분산락의 단점
        - Lock 유지 실패 가능성: 네트워크 장애로 인해 Lock이 유지되지 않을 수 있음
        - Deadlock 발생 가능성: 비정상 종료 등으로 Lock이 해제되지 않을 경우 Deadlock이 발생할 수 있음