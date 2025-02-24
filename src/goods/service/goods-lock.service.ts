import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AbstractLockManager } from '../../redis/abstract-lock-manager';
import { Lock } from 'redlock';

@Injectable()
export class GoodsLockService extends AbstractLockManager {
    async withLock(goodsId: number, lockTTLMs: number, task: () => Promise<void>): Promise<void> {
        let lock: Lock;

        try {
            // Redis Lock 획득
            lock = await this.acquireLock(`goods-stock-count:${goodsId}`, lockTTLMs);

            // Task 진행
            await task();
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('재고 소진작업 중 에러가 발생했습니다.');
            /*
                acquireLock 함수의 매개변수인 lockTTLMs 값을 통해
                일정시간 이후 만료되어 자동 Lock이 해제되긴 하지만,
                작업이 완료되었으므로(성공/실패) Lock을 명시적으로 해제시켜 줌
            */
        } finally {
            console.info('Lock이 해제되었습니다.');
            await this.releaseLock(lock);
        }
    }
}
