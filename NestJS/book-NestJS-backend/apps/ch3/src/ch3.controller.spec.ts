import { Test, TestingModule } from '@nestjs/testing';
import { Ch3Controller } from './ch3.controller';
import { Ch3Service } from './ch3.service';

describe('Ch3Controller', () => {
  let ch3Controller: Ch3Controller;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Ch3Controller],
      providers: [Ch3Service],
    }).compile();

    ch3Controller = app.get<Ch3Controller>(Ch3Controller);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(ch3Controller.getHello()).toBe('Hello World!');
    });
  });
});
