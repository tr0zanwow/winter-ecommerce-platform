import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SqsConsumerService } from './queue/sqs-consumer.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, SqsConsumerService],
})
export class AppModule {}
