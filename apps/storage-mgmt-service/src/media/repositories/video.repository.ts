import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { AbstractRepository } from 'libs/database/abstract.repository';
import { Video } from '../schema/video.schema';

@Injectable()
export class VideosRepository extends AbstractRepository<Video> {
  protected readonly logger = new Logger(VideosRepository.name);

  constructor(
    @InjectModel(Video.name) userModel: Model<Video>,
    @InjectConnection() connection: Connection,
  ) {
    super(userModel, connection);
  }
}
