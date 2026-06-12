import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'invites',
    }),
  ],
  providers: [InvitesService],
  controllers: [InvitesController],
  exports: [InvitesService],
})
export class InvitesModule {}
