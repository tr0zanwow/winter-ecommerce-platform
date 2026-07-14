import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentConsumerService } from './queue/payment-consumer.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PaymentConsumerService],
})
export class AppModule {}

