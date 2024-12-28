import { Injectable } from '@nestjs/common';
import { mediaConsumedMsg, MediaEvent } from '@app/pubsub';
import { UserStorageRepository } from 'libs/database/repositories/user-storage.repository';

@Injectable()
export class UsageMgmtService {
  constructor(
    private readonly userStorageInfoRepository: UserStorageRepository,
  ) {}
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

  private async getUserStorageInfo(userId: string) {
    let userStorageInfo = await this.userStorageInfoRepository.findOne({
      user: userId,
    });

    if (!userStorageInfo) {
      userStorageInfo = await this.userStorageInfoRepository.create({
        user: userId,
        total_videos: 0,
        total_storage_used: 0,
        dailyBandwidthUsed: 0,
        lastBandwidthReset: new Date(),
        storageLimit: 50,
        lastUpdated: new Date(),
      });
    }

    const now = new Date();
    const lastResetDate = new Date(userStorageInfo.lastBandwidthReset);

    if (
      lastResetDate.getUTCFullYear() !== now.getUTCFullYear() ||
      lastResetDate.getUTCMonth() !== now.getUTCMonth() ||
      lastResetDate.getUTCDate() !== now.getUTCDate()
    ) {
      userStorageInfo.dailyBandwidthUsed = 0;
      userStorageInfo.lastBandwidthReset = now;
      await this.userStorageInfoRepository.upsert(userStorageInfo.id, {
        dailyBandwidthUsed: 0,
        lastBandwidthReset: now,
      });
    }

    return userStorageInfo;
  }

  private async updateUserStorageInfo(
    userStorageInfo: any,
    videoSizeMB: number,
    isAdding: boolean,
    isUpdating: boolean = false, // Flag to check if it's an update
    oldVideoSizeMB: number = 0, // The old video size if it's an update
  ) {
    if (isAdding) {
      // For uploads
      userStorageInfo.total_videos += 1;
      userStorageInfo.total_storage_used += videoSizeMB;
      userStorageInfo.dailyBandwidthUsed += videoSizeMB;
    } else if (isUpdating) {
      // For updates: change in storage used by the difference between new and old video size
      const sizeDifference = videoSizeMB - oldVideoSizeMB;
      userStorageInfo.total_storage_used += sizeDifference;
      userStorageInfo.dailyBandwidthUsed += sizeDifference;
    } else {
      // For deletes
      userStorageInfo.total_videos -= 1;
      userStorageInfo.total_storage_used -= videoSizeMB;
      userStorageInfo.dailyBandwidthUsed -= videoSizeMB;
    }

    userStorageInfo.lastUpdated = new Date();

    // Upsert the updated storage info
    await this.userStorageInfoRepository.upsert(
      { user: userStorageInfo.user },
      userStorageInfo,
    );
  }

  async processMediaConsumed(msg: mediaConsumedMsg): Promise<void> {
    const userStorageInfo = await this.getUserStorageInfo(msg.userId);
    console.log(userStorageInfo);

    switch (msg.mediaEvent) {
      case MediaEvent.UPLOAD:
        await this.updateUserStorageInfo(
          userStorageInfo,
          msg.videoMetadata.size,
          true,
        );
        break;
      case MediaEvent.UPDATE:
        await this.updateUserStorageInfo(
          userStorageInfo,
          msg.videoMetadata.size,
          false,
          true,
          msg.oldVideoMetadata.size,
        );
        break;
      case MediaEvent.DELETE:
        await this.updateUserStorageInfo(
          userStorageInfo,
          msg.oldVideoMetadata.size,
          false,
        );
        break;
      default:
        console.error('Invalid MediaEvent:', msg.mediaEvent);
    }
  }
}
