import Redlock, { Lock } from 'redlock';
import { Redis } from 'ioredis';

export abstract class AbstractLockManager {
    protected redLock: Redlock;

    constructor() {
        const redisClients: Redis[] = [
            new Redis({ host: process.env.REDIS_HOST_1, port: parseInt(process.env.REDIS_PORT_1, 10) || 6379 }),
            new Redis({ host: process.env.REDIS_HOST_2, port: parseInt(process.env.REDIS_PORT_2, 10) || 6378 }),
            new Redis({ host: process.env.REDIS_HOST_3, port: parseInt(process.env.REDIS_PORT_3, 10) || 6377 })
        ];
        this.redLock = new Redlock(redisClients, { retryCount: 3, retryDelay: 200 });
    }

    async acquireLock(key: string, lockTTLMs: number): Promise<Lock> {
        return this.redLock.acquire([`lock:${key}`], lockTTLMs);
    }

    async releaseLock(lock: Lock): Promise<void> {
        await lock.release();
    }
}
