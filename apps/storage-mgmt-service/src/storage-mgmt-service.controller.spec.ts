import { Test, TestingModule } from '@nestjs/testing';
import { StorageMgmtServiceController } from './storage-mgmt-service.controller';
import { StorageMgmtServiceService } from './storage-mgmt-service.service';

describe('StorageMgmtServiceController', () => {
  let storageMgmtServiceController: StorageMgmtServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [StorageMgmtServiceController],
      providers: [StorageMgmtServiceService],
    }).compile();

    storageMgmtServiceController = app.get<StorageMgmtServiceController>(StorageMgmtServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(storageMgmtServiceController.getHello()).toBe('Hello World!');
    });
  });
});
