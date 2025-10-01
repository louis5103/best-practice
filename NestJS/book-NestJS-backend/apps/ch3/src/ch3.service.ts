import { Injectable } from '@nestjs/common';

@Injectable()
export class Ch3Service {
  getHello(): string {
    return 'Hello World!';
  }
}
