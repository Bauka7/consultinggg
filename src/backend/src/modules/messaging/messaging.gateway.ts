import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      sub: string;
      email: string;
      role: string;
    };
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: 'messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private connectedUsers = new Map<string, string[]>(); // userId -> socketId[]

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private messagingService: MessagingService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.data = { user: payload };

      const userId = payload.sub;
      const existing = this.connectedUsers.get(userId) || [];
      this.connectedUsers.set(userId, [...existing, client.id]);

      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);

      // Update consultant online status
      if (payload.role === 'consultant') {
        await this.updateConsultantOnlineStatus(userId, true);
      }

      client.join(`user:${userId}`);
    } catch (error) {
      this.logger.warn(`Connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.user?.sub;

    if (userId) {
      const sockets = (this.connectedUsers.get(userId) || []).filter((id) => id !== client.id);
      if (sockets.length === 0) {
        this.connectedUsers.delete(userId);
        // Update consultant offline status
        if (client.data?.user?.role === 'consultant') {
          await this.updateConsultantOnlineStatus(userId, false);
        }
      } else {
        this.connectedUsers.set(userId, sockets);
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_thread')
  async handleJoinThread(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    const userId = client.data.user.sub;
    const userRole = client.data.user.role as any;

    try {
      const thread = await this.prisma.thread.findUnique({ where: { id: data.threadId } });
      if (!thread) throw new WsException('Thread not found');

      // Business rule: clients cannot join factory threads
      if (userRole === 'client' && thread.kind === 'factory') {
        throw new WsException('Access denied to factory threads');
      }

      client.join(`thread:${data.threadId}`);
      return { event: 'joined', threadId: data.threadId };
    } catch (e) {
      throw new WsException(e.message || 'Failed to join thread');
    }
  }

  @SubscribeMessage('leave_thread')
  async handleLeaveThread(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    client.leave(`thread:${data.threadId}`);
    return { event: 'left', threadId: data.threadId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string; body: string; attachmentUrl?: string },
  ) {
    const userId = client.data.user.sub;
    const userRole = client.data.user.role as any;

    try {
      const message = await this.messagingService.sendMessage(
        { threadId: data.threadId, body: data.body, attachmentUrl: data.attachmentUrl },
        userId,
        userRole,
      );

      // Broadcast to all users in the thread room
      this.server.to(`thread:${data.threadId}`).emit('new_message', message);

      return message;
    } catch (e) {
      throw new WsException(e.message || 'Failed to send message');
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = client.data.user.sub;
    return this.messagingService.markRead(data.messageId, userId);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string; isTyping: boolean },
  ) {
    const userId = client.data.user.sub;
    client.to(`thread:${data.threadId}`).emit('user_typing', {
      userId,
      threadId: data.threadId,
      isTyping: data.isTyping,
    });
  }

  // Emit message to a specific user by userId
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  private async updateConsultantOnlineStatus(userId: string, online: boolean) {
    try {
      await this.prisma.consultantProfile.updateMany({
        where: { userId },
        data: { online },
      });
    } catch {
      // Ignore
    }
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake?.auth?.token;
    if (auth) return auth;

    const header = client.handshake?.headers?.authorization;
    if (header?.startsWith('Bearer ')) return header.substring(7);

    const query = client.handshake?.query?.token as string;
    if (query) return query;

    return null;
  }
}
