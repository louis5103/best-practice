import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RedisService } from '@liaoliaots/nestjs-redis';
export declare class AppService {
    private configService;
    private dataSource;
    private redisService;
    constructor(configService: ConfigService, dataSource: DataSource, redisService: RedisService);
    getAppInfo(): object;
    checkHealth(): Promise<object>;
    onApplicationBootstrap(): Promise<void>;
}
