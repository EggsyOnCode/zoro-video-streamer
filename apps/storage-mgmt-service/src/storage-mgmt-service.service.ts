import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageMgmtServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
