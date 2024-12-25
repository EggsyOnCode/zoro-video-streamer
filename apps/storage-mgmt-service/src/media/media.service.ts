import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { GcpStorageService } from './services/gcp-storage.service';
import { VideosRepository } from './repositories/video.repository';
import { Video } from './schema/video.schema';

@Injectable()
export class MediaService {
  constructor(
    private readonly gcpStorageService: GcpStorageService,
    private readonly videoRepository: VideosRepository,
  ) {}

  async create(
    createMediaDto: CreateMediaDto,
    video: Express.Multer.File,
    thumbnail: Express.Multer.File,
    userId: string,
  ) {
    // Validate files
    if (!video || !thumbnail) {
      throw new BadRequestException('Both video and thumbnail are required');
    }

    // Upload video and thumbnail to GCP
    const videoUploadResult = await this.gcpStorageService.uploadFile(
      createMediaDto.videoTitle,
      video.buffer,
      true, // true indicates video
    );
    const thumbnailUploadResult = await this.gcpStorageService.uploadFile(
      thumbnail.originalname,
      thumbnail.buffer,
      false, // false indicates thumbnail
    );

    // Create video entry
    const newVideo: Partial<Video> = {
      user: userId,
      length: video.size,
      size: video.size / (1024 * 1024), // Convert size to MB
      uploadDate: new Date(),
      thumbnailUrl: thumbnailUploadResult, // Save thumbnail URL
      videoTitle: createMediaDto.videoTitle,
      videoUrl: videoUploadResult,
      thumbnailFilename: thumbnail.originalname,
    };

    // Save video entry using VideoRepository
    const savedVideo = await this.videoRepository.create(newVideo);

    return savedVideo;
  }

  async update(
    videoId: string,
    updateMediaDto: UpdateMediaDto,
    userId: string, // for authorization
    video?: Express.Multer.File,
    thumbnail?: Express.Multer.File,
  ) {
    const videoEntry = await this.videoRepository.findOne({
      videoID: videoId,
      user: userId,
    });
    if (!videoEntry) {
      throw new BadRequestException('Video not found');
    }

    // Update video file if provided
    if (video) {
      const videoUploadResult = await this.gcpStorageService.uploadFile(
        updateMediaDto.videoTitle,
        video.buffer,
        true, // true indicates video
      );
      videoEntry.videoUrl = videoUploadResult; // Update file path with new video URL
      videoEntry.size = video.size / (1024 * 1024); // Convert size to MB
    }

    // Update thumbnail file if provided
    if (thumbnail) {
      const thumbnailUploadResult = await this.gcpStorageService.uploadFile(
        thumbnail.originalname,
        thumbnail.buffer,
        false, // false indicates thumbnail
      );
      videoEntry.thumbnailUrl = thumbnailUploadResult; // Update thumbnail URL
    }

    // Update metadata and title
    videoEntry.videoTitle = updateMediaDto.videoTitle || videoEntry.videoTitle;
    videoEntry.thumbnailFilename =
      thumbnail?.originalname || videoEntry.thumbnailFilename;

    // Save updated video entry
    const updatedVideo = await this.videoRepository.upsert(
      { videoID: videoId },
      videoEntry,
    );

    return updatedVideo as Video;
  }

  async remove(videoId: string, userId: string) {
    const videoEntry = await this.videoRepository.findOne({
      videoID: videoId,
      user: userId,
    });
    if (!videoEntry) {
      throw new BadRequestException('Video not found');
    }

    // Remove video and thumbnail files from GCP
    await this.gcpStorageService.deleteFile(videoEntry.videoTitle, true);
    if (videoEntry.thumbnailUrl) {
      await this.gcpStorageService.deleteFile(
        videoEntry.thumbnailFilename,
        false,
      );
    }

    // Remove video entry from the database
    return await this.videoRepository.remove({
      videoID: videoEntry.videoID,
    });
  }

  async findByTitle(title: string) {
    const videEntry = await this.videoRepository.find({ videoTitle: title });
    return {
      videoID: videEntry[0].videoID,
      videoTitle: videEntry[0].videoTitle,
      videoUrl: videEntry[0].videoUrl,
    };
  }

  async findById(videoId: string) {
    return await this.videoRepository.findOne({ videoID: videoId });
  }
}
