import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateMessageDto, CreateThreadDto, SendMessageBodyDto } from './dto/create-message.dto';

@ApiTags('messaging')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Get('threads')
  @ApiOperation({ summary: 'List threads (factory threads hidden from clients)' })
  getThreads(@CurrentUser('id') userId: string, @CurrentUser('role') role: Role) {
    return this.messagingService.getThreads(userId, role);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Total unread message count' })
  getUnreadCount(@CurrentUser('id') userId: string, @CurrentUser('role') role: Role) {
    return this.messagingService.getUnreadCount(userId, role);
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Get thread metadata' })
  getThread(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.messagingService.getThread(id, userId, role);
  }

  @Post('threads')
  @ApiOperation({ summary: 'Create thread manually (usually created automatically)' })
  createThread(
    @Body() dto: CreateThreadDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.messagingService.createThread(dto, userId, role);
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: 'Paginated message history for a thread' })
  getMessages(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagingService.getMessages(id, userId, role, pagination);
  }

  // Primary send endpoint — frontend posts here, socket broadcast happens in service
  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Send a message to a thread (REST endpoint)' })
  sendToThread(
    @Param('id') threadId: string,
    @Body() body: SendMessageBodyDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.messagingService.sendMessage(
      { threadId, body: body.body, attachmentUrl: body.attachmentUrl },
      userId,
      role,
    );
  }

  // Legacy endpoint (kept for backwards compat with gateway)
  @Post('messages')
  @ApiOperation({ summary: 'Send message (legacy, use POST /threads/:id/messages)' })
  sendMessage(
    @Body() dto: CreateMessageDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.messagingService.sendMessage(dto, userId, role);
  }

  @Patch('messages/:id/read')
  @ApiOperation({ summary: 'Mark a single message as read' })
  markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.messagingService.markRead(id, userId);
  }
}
