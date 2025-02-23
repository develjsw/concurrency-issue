import { Injectable, OnModuleInit } from '@nestjs/common';
import Redlock, { Lock } from 'redlock';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
    private redis: Redis;

    private redLock: Redlock;

    onModuleInit(): void {
        this.redis = new Redis({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT, 10) || 6379
        });

        this.redLock = new Redlock([this.redis]);
    }

    async acquireLock(key: string, lockTTLMs: number): Promise<Lock> {
        return this.redLock.acquire([`lock:${key}`], lockTTLMs);
    }
}
