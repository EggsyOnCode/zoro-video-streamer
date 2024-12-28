export * from './pubsub.module';
export * from './pubsub.service';

export enum MediaEvent {
  UPLOAD,
  DELETE,
  UPDATE,
}

export interface VideoMetadata {
  title: string;
  length: string;
  size: number;
  uploadDate: Date;
}

export interface mediaConsumedMsg {
  mediaEvent: MediaEvent;
  videoId: string;
  userId: string;
  videoMetadata: VideoMetadata;
  oldVideoMetadata?: VideoMetadata;
  timeStamp: Date;
}
