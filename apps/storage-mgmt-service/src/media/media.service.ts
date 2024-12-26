import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { GcpStorageService } from './services/gcp-storage.service';
import { VideosRepository } from './repositories/video.repository';
import { Video } from './schema/video.schema';
import { UserStorageRepository } from './repositories/user-storage.repository';
import getVideoDurationInSeconds from 'get-video-duration';
import { Readable } from 'stream';

@Injectable()
export class MediaService {
  constructor(
    private readonly gcpStorageService: GcpStorageService,
    private readonly videoRepository: VideosRepository,
    private readonly userStorageInfoRepository: UserStorageRepository,
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
    videoTitle: string,
  ) {
    const videoUploadResult = await this.gcpStorageService.uploadFile(
      videoTitle,
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

  private async updateUserStorageInfo(
    userStorageInfo: any,
    videoSizeMB: number,
    isAdding: boolean,
  ) {
    userStorageInfo.total_videos += isAdding ? 1 : -1;
    userStorageInfo.total_storage_used += isAdding ? videoSizeMB : -videoSizeMB;
    userStorageInfo.dailyBandwidthUsed += videoSizeMB;
    userStorageInfo.lastUpdated = new Date();

    await this.userStorageInfoRepository.upsert(
      { user: userStorageInfo.user },
      userStorageInfo,
    );
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
      createMediaDto.videoTitle,
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
    };

    const savedVideo = await this.videoRepository.create(newVideo);

    await this.updateUserStorageInfo(userStorageInfo, videoSizeMB, true);

    return {
      user: savedVideo.user,
      videoTitel: savedVideo.videoTitle,
      length: savedVideo.length,
      size: savedVideo.size,
      uploadedDate: savedVideo.uploadDate,
      videoId: savedVideo.videoID,
      videoUrl: savedVideo.videoUrl,
      thumbnailUrl: savedVideo.thumbnailUrl,
    };
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

    // Delete previous video and thumbnail if new ones are provided
    if (video) {
      await this.gcpStorageService.deleteFile(videoEntry.videoTitle, true);
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
        updateMediaDto.videoTitle || videoEntry.videoTitle,
        video.buffer,
        true,
      );
      videoEntry.videoUrl = videoUploadResult;
      videoEntry.size = newVideoSizeMB;
      videoEntry.length = await this.getVideoLength(video.buffer);
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

    // Update user storage info
    userStorageInfo.total_storage_used =
      userStorageInfo.total_storage_used - videoEntry.size + newVideoSizeMB;
    userStorageInfo.dailyBandwidthUsed += newVideoSizeMB;
    userStorageInfo.lastUpdated = new Date();

    await this.userStorageInfoRepository.upsert(
      { user: userId },
      userStorageInfo,
    );

    return {
      user: updatedVideo.user,
      videoTitel: updatedVideo.videoTitle,
      length: updatedVideo.length,
      size: updatedVideo.size,
      uploadedDate: updatedVideo.uploadDate,
      videoId: updatedVideo.videoID,
      videoUrl: updatedVideo.videoUrl,
      thumbnailUrl: updatedVideo.thumbnailUrl,
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

    await this.gcpStorageService.deleteFile(videoEntry.videoTitle, true);
    if (videoEntry.thumbnailUrl) {
      await this.gcpStorageService.deleteFile(
        videoEntry.thumbnailFilename,
        false,
      );
    }

    const userStorageInfo = await this.getUserStorageInfo(userId);
    await this.updateUserStorageInfo(userStorageInfo, videoEntry.size, false);

    try {
      return await this.videoRepository.remove({ videoID: videoEntry.videoID });
    } catch (error) {
      throw new InternalServerErrorException("couldn't remove the video.");
    }
  }
}
