import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
    });

    async set(key: string, value: any) {
        await this.redis.set(key, JSON.stringify(value));
    }

    async get(key: string) {
        const value = await this.redis.get(key);

        if (!value) {
            return null;
        }

        return JSON.parse(value);
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }
}