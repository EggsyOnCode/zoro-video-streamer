import { Test, TestingModule } from '@nestjs/testing';
import { UsageMgmtServiceController } from './usage-mgmt-service.controller';
import { UsageMgmtServiceService } from './usage-mgmt-service.service';

describe('UsageMgmtServiceController', () => {
  let usageMgmtServiceController: UsageMgmtServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UsageMgmtServiceController],
      providers: [UsageMgmtServiceService],
    }).compile();

    usageMgmtServiceController = app.get<UsageMgmtServiceController>(UsageMgmtServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(usageMgmtServiceController.getHello()).toBe('Hello World!');
    });
  });
});
