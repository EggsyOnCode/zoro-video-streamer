import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { GcpStorageService } from './services/gcp-storage.service';
import { VideosRepository } from './repositories/video.repository';
import { Video } from './schema/video.schema';
import getVideoDurationInSeconds from 'get-video-duration';
import { Readable } from 'stream';
import { BulkResponse } from 'apps/user-acc-mgmt-service/src/dto/create-user.dto';
import { GCPubSubController } from './services/GcpPubSubController.service';
import { ConfigService } from '@nestjs/config';
import { UserStorageRepository } from 'libs/database';
import { MediaEvent, mediaConsumedMsg } from '@app/pubsub';

@Injectable()
export class MediaService {
  constructor(
    private readonly gcpStorageService: GcpStorageService,
    private readonly videoRepository: VideosRepository,
    private readonly configService: ConfigService,
    private readonly userStorageInfoRepository: UserStorageRepository,
    private readonly pubSubService: GCPubSubController,
  ) {}

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

  private async validatePreChecks(
    userStorageInfo: any,
    videoSizeMB: number,
    videoTitle: string,
    thumbnailFilename: string,
  ) {
    const totalStorageAfterUpload =
      userStorageInfo.total_storage_used + videoSizeMB;
    const dailyBandwidthAfterUpload =
      userStorageInfo.dailyBandwidthUsed + videoSizeMB;

    if (totalStorageAfterUpload > userStorageInfo.storageLimit) {
      throw new BadRequestException(
        'Storage limit exceeded. Cannot upload the video.',
      );
    }

    if (dailyBandwidthAfterUpload > 100) {
      throw new BadRequestException(
        'Daily bandwidth limit exceeded. Cannot upload the video.',
      );
    }

    const existingVideo = await this.videoRepository.findOne({
      $or: [{ videoTitle }, { thumbnailFilename }],
    });

    if (existingVideo) {
      throw new BadRequestException(
        'A video with a similar title or thumbnail already exists.',
      );
    }
  }

  private async uploadFiles(
    video: Express.Multer.File,
    thumbnail: Express.Multer.File,
  ) {
    const videoUploadResult = await this.gcpStorageService.uploadFile(
      video.originalname,
      video.buffer,
      true,
    );

    const thumbnailUploadResult = await this.gcpStorageService.uploadFile(
      thumbnail.originalname,
      thumbnail.buffer,
      false,
    );

    return { videoUploadResult, thumbnailUploadResult };
  }

  formatToHHMMSS(lengthInSeconds: number): string {
    const hours = Math.floor(lengthInSeconds / 3600);
    const minutes = Math.floor((lengthInSeconds % 3600) / 60);
    const seconds = Math.floor(lengthInSeconds % 60);

    // Format each unit to be two digits (e.g., 01, 09)
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  async getVideoLength(buffer: Buffer): Promise<string> {
    const readableStream = Readable.from(buffer);
    const sec = await getVideoDurationInSeconds(readableStream);
    return this.formatToHHMMSS(sec);
  }

  async create(
    createMediaDto: CreateMediaDto,
    video: Express.Multer.File,
    thumbnail: Express.Multer.File,
    userId: string,
    username: string,
  ) {
    if (!video || !thumbnail) {
      throw new BadRequestException('Both video and thumbnail are required');
    }

    const videoSizeMB = +(video.size / (1024 * 1024)).toFixed(2);
    const userStorageInfo = await this.getUserStorageInfo(userId);

    await this.validatePreChecks(
      userStorageInfo,
      videoSizeMB,
      createMediaDto.videoTitle,
      thumbnail.originalname,
    );

    const { videoUploadResult, thumbnailUploadResult } = await this.uploadFiles(
      video,
      thumbnail,
    );

    const vidLength = await this.getVideoLength(video.buffer);

    const newVideo: Partial<Video> = {
      user: userId,
      length: vidLength,
      size: videoSizeMB,
      uploadDate: new Date(),
      thumbnailUrl: thumbnailUploadResult,
      videoTitle: createMediaDto.videoTitle,
      videoUrl: videoUploadResult,
      thumbnailFilename: thumbnail.originalname,
      videoFileName: video.originalname,
      username: username,
    };

    const savedVideo = await this.videoRepository.create(newVideo);
    console.log('hello...');

    await this.notifyMediaConsumed(MediaEvent.UPLOAD, savedVideo, userId);

    // this is the resp of the usage monitoring service
    return {
      user: savedVideo.user,
      videoTitel: savedVideo.videoTitle,
      length: savedVideo.length,
      size: savedVideo.size,
      uploadedDate: savedVideo.uploadDate,
      videoId: savedVideo.videoID,
    }; //;
  }

  async update(
    videoId: string,
    updateMediaDto: UpdateMediaDto,
    userId: string,
    video?: Express.Multer.File,
    thumbnail?: Express.Multer.File,
  ) {
    // Fetch the existing video entry
    const videoEntry = await this.videoRepository.findOne({
      videoID: videoId,
      user: userId,
    });
    const oldVideo = videoEntry;
    if (!videoEntry) {
      throw new BadRequestException('Video not found');
    }

    const newVideoSizeMB = video
      ? +(video.size / (1024 * 1024)).toFixed(2)
      : videoEntry.size;

    // Fetch user storage info
    const userStorageInfo = await this.getUserStorageInfo(userId);

    // Pre-checks for bandwidth and storage
    if (video || thumbnail) {
      const adjustedStorageAfterUpdate =
        userStorageInfo.total_storage_used - videoEntry.size + newVideoSizeMB;

      const dailyBandwidthAfterUpdate =
        userStorageInfo.dailyBandwidthUsed + newVideoSizeMB;

      if (adjustedStorageAfterUpdate > userStorageInfo.storageLimit) {
        throw new BadRequestException(
          'Storage limit exceeded. Cannot upload the video.',
        );
      }

      if (dailyBandwidthAfterUpdate > 100) {
        throw new BadRequestException(
          'Daily bandwidth limit exceeded. Cannot upload the video.',
        );
      }
    }

    console.log(videoEntry.videoFileName);

    // Delete previous video and thumbnail if new ones are provided
    if (video) {
      await this.gcpStorageService.deleteFile(videoEntry.videoFileName, true);
    }
    if (thumbnail) {
      await this.gcpStorageService.deleteFile(
        videoEntry.thumbnailFilename,
        false,
      );
    }

    // Upload new video and thumbnail
    if (video) {
      const videoUploadResult = await this.gcpStorageService.uploadFile(
        video.originalname,
        video.buffer,
        true,
      );
      videoEntry.videoUrl = videoUploadResult;
      videoEntry.size = newVideoSizeMB;
      videoEntry.length = await this.getVideoLength(video.buffer);
      videoEntry.videoFileName = video.originalname;
    }

    if (thumbnail) {
      const thumbnailUploadResult = await this.gcpStorageService.uploadFile(
        thumbnail.originalname,
        thumbnail.buffer,
        false,
      );
      videoEntry.thumbnailUrl = thumbnailUploadResult;
    }

    // Update video metadata
    videoEntry.videoTitle = updateMediaDto.videoTitle || videoEntry.videoTitle;
    videoEntry.thumbnailFilename =
      thumbnail?.originalname || videoEntry.thumbnailFilename;

    // Save the updated video entry
    const updatedVideo = await this.videoRepository.upsert(
      { videoID: videoId },
      videoEntry,
    );

    await this.notifyMediaConsumed(
      MediaEvent.UPDATE,
      videoEntry,
      userId,
      oldVideo,
    );

    return {
      user: updatedVideo.user,
      videoTitle: updatedVideo.videoTitle,
      length: updatedVideo.length,
      size: updatedVideo.size,
      uploadedDate: updatedVideo.uploadDate,
      videoId: updatedVideo.videoID,
    };
  }

  async remove(videoId: string, userId: string) {
    const videoEntry = await this.videoRepository.findOne({
      videoID: videoId,
      user: userId,
    });
    if (!videoEntry) {
      throw new BadRequestException('Video not found');
    }

    await this.gcpStorageService.deleteFile(videoEntry.videoFileName, true);
    if (videoEntry.thumbnailUrl) {
      await this.gcpStorageService.deleteFile(
        videoEntry.thumbnailFilename,
        false,
      );
    }

    // const userStorageInfo = await this.getUserStorageInfo(userId);
    // await this.updateUserStorageInfo(userStorageInfo, videoEntry.size, false);

    try {
      await this.videoRepository.remove({ videoID: videoEntry.videoID });

      // if successful, notify the usage monitoring service
      await this.notifyMediaConsumed(MediaEvent.DELETE, videoEntry, userId);
      return {
        msg: 'success',
      };
    } catch (error) {
      throw new InternalServerErrorException("couldn't remove the video.");
    }
  }

  // should return video signedUrl , thumbnail's signedUrl, video title, video length, upload date
  async getVideo(videoId: string): Promise<{
    videoSignedUrl: string;
    thumbnailSignedUrl: string;
    title: string;
    length: string;
    uploadDate: Date;
    username: string;
  }> {
    const video = await this.videoRepository.findOne({
      videoID: videoId,
    });

    if (!video) {
      throw new NotFoundException(`Video with ID ${videoId} not found.`);
    }

    // Fetch video and thumbnail file names from your database
    const videoFilename = video.videoFileName;
    const thumbnailFilename = video.thumbnailFilename;

    // Generate signed URLs
    const videoSignedUrl = await this.gcpStorageService.generateSignedUrl(
      videoFilename,
      true,
    );
    const thumbnailSignedUrl = await this.gcpStorageService.generateSignedUrl(
      thumbnailFilename,
      false,
    );

    // Fetch video metadata (example: title and length)
    const videoMetadata = await this.gcpStorageService.getFileMetadata(
      videoFilename,
      true,
    );

    if (!videoMetadata) {
      throw new NotFoundException(`Video with ID ${videoId} not found.`);
    }

    // Example metadata extraction
    const title = video.videoTitle;
    const length = video.length;
    const uploadDate = video.uploadDate;
    const username = video.username;

    return {
      videoSignedUrl,
      thumbnailSignedUrl,
      title,
      length,
      uploadDate,
      username,
    };
  }

  private convertSecondsToHMS(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
  }

  async getPaginatedVideos(
    pageIndex: number = 0,
    pageSize: number = 50,
    userId?: string,
  ): Promise<
    {
      videoId: string;
      title: string;
      length: string;
      thumbnailSignedUrl: string;
      uploadDate: Date;
      uploadedBy: string;
    }[]
  > {
    if (pageSize > 50) {
      throw new BadRequestException('Page size cannot exceed 50.');
    }

    const start = pageIndex * pageSize;
    const thumbnails = await this.gcpStorageService.listFiles(
      false, // Indicates the thumbnail bucket
      start,
      pageSize,
    );

    const videos = await Promise.all(
      thumbnails.map(async (thumbnail) => {
        const thumbnailSignedUrl =
          await this.gcpStorageService.generateSignedUrl(
            thumbnail.name,
            false,
            600, // 10 minutes expiration
          );
        console.log(thumbnail.name);

        let video;
        if (userId) {
          video = await this.videoRepository.findOne({
            thumbnailFilename: thumbnail.name,
            user: userId,
          });
        } else {
          video = await this.videoRepository.findOne({
            thumbnailFilename: thumbnail.name,
          });
        }
        console.log(video);

        if (!video) {
          // throw new InternalServerErrorException("coudln't list the videos");
          return;
        }

        return {
          videoId: video.videoID,
          title: video.videoTitle,
          length: video.length,
          thumbnailSignedUrl,
          uploadDate: video.uploadDate,
          uploadedBy: video.username,
        };
      }),
    );

    console.log(videos);

    return videos.filter((video) => video !== undefined);
  }

  async bulkRemove(
    videoIds: string[],
    userId: string,
  ): Promise<BulkResponse[]> {
    let responses = [];

    for (const videoId of videoIds) {
      const { msg } = await this.remove(videoId, userId);
      responses.push({
        videoId: videoId,
        msg: msg,
      });
    }

    return responses as BulkResponse[];
  }

  async notifyMediaConsumed(
    event: MediaEvent,
    videoEntry: Partial<Video>,
    userId: string,
    oldVideoEntry?: Partial<Video>,
  ) {
    const message: mediaConsumedMsg = {
      mediaEvent: event,
      videoId: videoEntry.videoID,
      userId: userId,
      videoMetadata: {
        title: videoEntry.videoTitle,
        length: videoEntry.length,
        size: videoEntry.size,
        uploadDate: videoEntry.uploadDate,
      },
      timeStamp: new Date(),
    };
    if (oldVideoEntry) {
      message.oldVideoMetadata = {
        title: oldVideoEntry.videoTitle,
        length: oldVideoEntry.length,
        size: oldVideoEntry.size,
        uploadDate: oldVideoEntry.uploadDate,
      };
    }
    await this.pubSubService.sendMessage(
      this.configService.get('PUBSUB_TOPIC'),
      message,
    );
  }
}
