import { Module } from '@nestjs/common';
import { Ch3Controller } from './ch3.controller';
import { Ch3Service } from './ch3.service';
import { UsersModule } from './users/users.module';
import { ApiController } from './api/api.controller';

@Module({
  imports: [UsersModule],
  controllers: [Ch3Controller, ApiController],
  providers: [Ch3Service],
})
export class Ch3Module {}
