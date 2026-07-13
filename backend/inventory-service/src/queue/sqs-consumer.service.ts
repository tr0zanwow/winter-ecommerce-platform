import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class SqsConsumerService implements OnModuleInit {
  private readonly logger = new Logger(SqsConsumerService.name);
  private sqsClient: SQSClient;
  private readonly queueUrl = 'https://sqs.us-east-1.amazonaws.com/880252974759/WinterInventoryUpdateQueue';

  onModuleInit() {
    this.sqsClient = new SQSClient({ region: 'us-east-1' });
    this.logger.log('SQS Polling client initialized pointing to region us-east-1');
    
    // Trigger the polling loop asynchronously to avoid blocking NestJS application bootstrap
    this.startPolling().catch((error) => {
      this.logger.error('SQS polling loop crashed', error);
    });
  }

  private async startPolling(): Promise<void> {
    this.logger.log(`Starting SQS message polling from: ${this.queueUrl}`);

    while (true) {
      try {
        const receiveParams = {
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
        };

        const command = new ReceiveMessageCommand(receiveParams);
        const data = await this.sqsClient.send(command);

        if (data.Messages && data.Messages.length > 0) {
          for (const message of data.Messages) {
            this.logger.log(`[INVENTORY WORKER] Intercepted Order Created Event Payload: ${message.Body}`);

            if (message.ReceiptHandle) {
              const deleteParams = {
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle,
              };
              const deleteCommand = new DeleteMessageCommand(deleteParams);
              await this.sqsClient.send(deleteCommand);
            }
          }
        }
      } catch (error) {
        this.logger.error('Error during SQS poll iteration, retrying in 5 seconds...', error);
        // Wait 5 seconds before retrying to prevent rapid error looping
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
}
