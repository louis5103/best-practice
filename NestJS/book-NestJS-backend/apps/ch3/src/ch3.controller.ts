import { Controller, Get } from '@nestjs/common';
import { Ch3Service } from './ch3.service';

@Controller()
export class Ch3Controller {
  constructor(private readonly ch3Service: Ch3Service) {}

  @Get()
  getHello(): string {
    return this.ch3Service.getHello();
  }
}
