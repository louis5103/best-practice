import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private userRepository;
    constructor(configService: ConfigService, userRepository: Repository<User>);
    validate(payload: {
        sub: number;
        email: string;
        role: string;
        iat: number;
        exp: number;
    }): Promise<{
        id: number;
        email: string;
        name: string;
        role: "user" | "admin" | "moderator";
        isActive: true;
        isEmailVerified: true;
        lastLoginAt: Date;
    }>;
}
export {};
