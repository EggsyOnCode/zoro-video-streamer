import { Test, TestingModule } from '@nestjs/testing';
import { UserAccMgmtServiceController } from './user-acc-mgmt-service.controller';
import { UserAccMgmtServiceService } from './user-acc-mgmt-service.service';

describe('UserAccMgmtServiceController', () => {
  let userAccMgmtServiceController: UserAccMgmtServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserAccMgmtServiceController],
      providers: [UserAccMgmtServiceService],
    }).compile();

    userAccMgmtServiceController = app.get<UserAccMgmtServiceController>(UserAccMgmtServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(userAccMgmtServiceController.getHello()).toBe('Hello World!');
    });
  });
});
