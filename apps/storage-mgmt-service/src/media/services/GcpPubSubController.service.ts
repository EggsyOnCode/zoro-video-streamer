import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mediaConsumedMsg } from '../utils/pubSubTypes';
import { PubSub } from '@google-cloud/pubsub';

@Injectable()
export class GCPubSubController implements OnApplicationShutdown {
  client: PubSub;

  constructor(private readonly configService: ConfigService) {
    this.client = new PubSub();
  }

  async sendMessage(
    topicName: string,
    message: mediaConsumedMsg,
  ): Promise<void> {
    const topic = this.client.topic(topicName);
    const dataBuffer = Buffer.from(JSON.stringify(message));

    try {
      topic.publish(dataBuffer).then((message) => {
        console.log(`Message ${message} published to topic ${topicName}`);
      });
    } catch (error) {
      console.error('Error publishing message:', error);
    }
  }

  onApplicationShutdown() {
    return this.client.close();
  }
}
