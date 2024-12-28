export enum MediaEvent {
  UPLOAD,
  DELETE,
  UPDATE,
}

interface VideoMetadata {
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
  timeStamp: Date;
}
