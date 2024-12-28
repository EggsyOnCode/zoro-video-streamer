import { Injectable } from '@nestjs/common';
import { mediaConsumedMsg, MediaEvent } from '@app/pubsub';

@Injectable()
export class UsageMgmtService {
  parseMediaConsumedMsg(jsonString: string): mediaConsumedMsg {
    const rawObject = JSON.parse(jsonString);

    // Transform the raw object into the desired structure
    const parsedObject: mediaConsumedMsg = {
      mediaEvent: rawObject.mediaEvent as MediaEvent, // Cast to MediaEvent enum
      videoId: rawObject.videoId || '', // Handle missing `videoId` with default value
      userId: rawObject.userId,
      videoMetadata: {
        title: rawObject.videoMetadata.title,
        length: rawObject.videoMetadata.length,
        size: rawObject.videoMetadata.size,
        uploadDate: new Date(rawObject.videoMetadata.uploadDate), // Convert string to Date
      },
      timeStamp: new Date(rawObject.timeStamp), // Convert string to Date
    };

    return parsedObject;
  }
}
