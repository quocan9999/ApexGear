import { Controller, Get, MessageEvent, Patch, Query, Sse } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@ApiTags('Admin Notifications')
@Controller('admin/notifications')
@Roles(Role.ADMIN, Role.ORDER_MANAGER, Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER)
export class AdminNotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List shared admin notifications' })
  list(@Query() query: QueryNotificationsDto) {
    return this.notificationsService.list(query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count unread shared admin notifications' })
  unreadCount() {
    return this.notificationsService.unreadCount();
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all shared admin notifications as read' })
  markAllRead() {
    return this.notificationsService.markAllRead();
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Stream shared admin notifications' })
  stream(): Observable<MessageEvent> {
    return (fromEvent(this.eventEmitter, 'admin.notification') as Observable<unknown>).pipe(
      map((payload) => ({ data: payload }) as MessageEvent),
    );
  }
}
