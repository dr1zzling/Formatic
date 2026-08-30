import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Injectable, Logger } from '@nestjs/common'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class FormEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('FormEventsGateway')

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('joinForm')
  handleJoinForm(
    @MessageBody() data: { slug?: string; formId?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomKey = data?.slug ? data.slug : String(data?.formId)
    const room = `form_${roomKey}`
    client.join(room)
    this.logger.log(`Client ${client.id} joined room ${room}`)
    return { event: 'joinedRoom', room }
  }

  @SubscribeMessage('leaveForm')
  handleLeaveForm(
    @MessageBody() data: { slug?: string; formId?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomKey = data?.slug ? data.slug : String(data?.formId)
    const room = `form_${roomKey}`
    client.leave(room)
    this.logger.log(`Client ${client.id} left room ${room}`)
    return { event: 'leftRoom', room }
  }

  notifyFormUpdated(formId: number, slug: string, soalList: any[]) {
    if (!this.server) return
    const payload = {
      formId,
      slug,
      soal: soalList,
      updatedAt: new Date().toISOString(),
    }
    if (slug) {
      this.server.to(`form_${slug}`).emit('formUpdated', payload)
    }
    if (formId) {
      this.server.to(`form_${formId}`).emit('formUpdated', payload)
    }
    this.logger.log(`Broadcasted formUpdated for formId ${formId} / slug ${slug}`)
  }
}
