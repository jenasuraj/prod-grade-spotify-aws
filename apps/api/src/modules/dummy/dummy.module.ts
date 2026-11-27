import { Module } from '@nestjs/common';
import { DummyService } from './dummy.service.js';
import { DummyController } from './dummy.controller.js';

@Module({
  providers: [DummyService],
  controllers: [DummyController],
})
export class DummyModule {}
