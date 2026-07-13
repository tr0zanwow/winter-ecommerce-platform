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

            try {
              if (message.Body) {
                const snsPayload = JSON.parse(message.Body);
                const orderData = typeof snsPayload.Message === 'string' ? JSON.parse(snsPayload.Message) : snsPayload;

                if (orderData && Array.isArray(orderData.items) && orderData.items.length > 0) {
                  const decrementPayload = orderData.items.map((item: any) => ({
                    sku: item.sku,
                    quantity: item.quantity,
                  }));

                  this.logger.log(`Dispatching stock decrement to catalog service: ${JSON.stringify(decrementPayload)}`);

                  const response = await fetch('http://catalog-service:3000/api/products/decrement-stock', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(decrementPayload),
                  });

                  this.logger.log(`[INVENTORY WORKER] Internal cluster response status: ${response.status} ${response.statusText}`);
                  if (!response.ok) {
                    const errorText = await response.text();
                    this.logger.error(`Stock decrement failed on catalog service: ${errorText}`);
                  }
                }
              }
            } catch (err) {
              this.logger.error('Failed to parse or dispatch stock decrement event payload', err);
            }

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
