import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { AbstractRepository } from 'libs/database/abstract.repository';
import { UserStorageInfo } from '../../schema/user-storage.schema';

@Injectable()
export class UserStorageRepository extends AbstractRepository<UserStorageInfo> {
  protected readonly logger = new Logger(UserStorageRepository.name);

  constructor(
    @InjectModel(UserStorageInfo.name) userModel: Model<UserStorageInfo>,
    @InjectConnection() connection: Connection,
  ) {
    super(userModel, connection);
  }
}
