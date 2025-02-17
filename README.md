### 동시성 이슈 ( concurrency-issue )

- 동시성 이슈란 ?
  - 여러 트랜잭션이나 프로세스가 동시에 같은 데이터에 접근 및 변경하려 할 때 발생하는 데이터 불일치 또는 충돌 문제를 의미함
    - EX.1) 좌석 예매 시스템에서 A01번 자리를 서로 다른 2명의 사람이 동시에 예매하려고 하는 경우 발생
    - EX.2) 상품의 재고가 1개 남은 상황에서 3명의 사람이 동시에 구매하려고 하는 경우 발생


- 동시성 이슈를 해결하기 위한 대표방법 3가지
  - [ DB에서 해결하는 방법 ]
    - `낙관적 락` ( Optimistic Lock ) : 데이터 충돌이 드물다고 가정하고, 트랜잭션이 데이터를 수정하기 전에 버전(Version) 번호나 타임스탬프를 확인하여 충돌을 감지하는 방식
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
    - `Redis 분산락` ( Distributed Lock ) : 멀티 인스턴스 환경에서 동시성을 제어하는 방법으로 보통 SETNX (SET if Not Exists) 명령어를 이용하여 특정 리소스(데이터)를 다른 프로세스가 접근하지 못하게 만듦
