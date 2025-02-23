import { Injectable, OnModuleInit } from '@nestjs/common';
import Redlock, { Lock } from 'redlock';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
    private redis: Redis;

    private redLock: Redlock;

    onModuleInit(): any {
        this.redis = new Redis({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT, 10) || 6379
        });

        this.redLock = new Redlock([this.redis]/*, {
            driftFactor: 0.01,
            retryCount: 5,
            retryDelay: 200
        }*/);
    }

    // async setNx(key: string, value: string): Promise<'OK' | null> {
    //     return this.redis.set(key, value, 'PX', 1000, 'NX');
    // }

    async acquireLock(key: string, lockTTLMs: number): Promise<Lock> {
        return this.redLock.acquire([`lock:${key}`], lockTTLMs);
    }
}
