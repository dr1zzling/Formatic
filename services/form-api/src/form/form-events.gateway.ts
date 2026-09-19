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

  /**
   * Broadcast progress responden ke room monitoring creator.
   * Dipanggil dari MonitoringService setiap kali PATCH /form/monitoring/progress diterima.
   * Room: `monitoring_${slug}` — hanya creator yang join room ini.
   */
  notifyProgressUpdated(slug: string, progressData: {
    user_id: number
    user_username: string
    current_page: number
    current_soal: number
    total_pages: number
    total_soal: number
    status: string
    start_at: string
  }) {
    if (!this.server) return
    const payload = {
      ...progressData,
      slug,
      updatedAt: new Date().toISOString(),
    }
    this.server.to(`monitoring_${slug}`).emit('progressUpdated', payload)
    this.logger.log(`Broadcasted progressUpdated for slug ${slug} — user ${progressData.user_username} halaman ${progressData.current_page}`)
  }

  /**
   * Creator join room monitoring untuk form tertentu.
   * Event: joinMonitoring { slug }
   */
  @SubscribeMessage('joinMonitoring')
  handleJoinMonitoring(
    @MessageBody() data: { slug: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `monitoring_${data?.slug}`
    client.join(room)
    this.logger.log(`Creator ${client.id} joined monitoring room ${room}`)
    return { event: 'joinedMonitoring', room }
  }

  @SubscribeMessage('leaveMonitoring')
  handleLeaveMonitoring(
    @MessageBody() data: { slug: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `monitoring_${data?.slug}`
    client.leave(room)
    this.logger.log(`Creator ${client.id} left monitoring room ${room}`)
    return { event: 'leftMonitoring', room }
  }
}
