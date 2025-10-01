import { NestFactory } from '@nestjs/core';
import { Ch3Module } from './ch3.module';

async function bootstrap() {
  const app = await NestFactory.create(Ch3Module);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
