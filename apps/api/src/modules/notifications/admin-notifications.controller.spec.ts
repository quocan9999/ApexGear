import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, Subject } from 'rxjs';
import * as rxjs from 'rxjs';
import { AdminNotificationsController } from './admin-notifications.controller';
import { NotificationsService } from './notifications.service';

describe('AdminNotificationsController', () => {
  let controller: AdminNotificationsController;
  let notificationsService: {
    list: jest.Mock;
    unreadCount: jest.Mock;
    markAllRead: jest.Mock;
  };
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    notificationsService = {
      list: jest.fn(),
      unreadCount: jest.fn(),
      markAllRead: jest.fn(),
    };
    eventEmitter = { on: jest.fn(), off: jest.fn() } as unknown as EventEmitter2;
    controller = new AdminNotificationsController(
      notificationsService as unknown as NotificationsService,
      eventEmitter,
    );
  });

  it('lists shared admin notifications through the service', async () => {
    const query = { page: 1, limit: 20, search: 'AG' };
    const response = { data: [], meta: { page: 1, limit: 20, total: 0 } };
    notificationsService.list.mockResolvedValue(response);

    await expect(controller.list(query)).resolves.toBe(response);
    expect(notificationsService.list).toHaveBeenCalledWith(query);
  });

  it('returns shared unread count through the service', async () => {
    notificationsService.unreadCount.mockResolvedValue(7);

    await expect(controller.unreadCount()).resolves.toBe(7);
    expect(notificationsService.unreadCount).toHaveBeenCalledWith();
  });

  it('marks all shared notifications as read through the service', async () => {
    notificationsService.markAllRead.mockResolvedValue({ count: 2 });

    await expect(controller.markAllRead()).resolves.toEqual({ count: 2 });
    expect(notificationsService.markAllRead).toHaveBeenCalledWith();
  });

  it('streams admin.notification events as SSE message events', (done) => {
    const subject = new Subject<unknown>();
    const fromEventSpy = jest.spyOn(rxjs, 'fromEvent').mockReturnValue(subject);
    const payload = { id: 'n1', type: 'NEW_ORDER', title: 'Đơn hàng mới #AG-1' };

    const result = controller.stream();

    expect(fromEventSpy).toHaveBeenCalledWith(eventEmitter, 'admin.notification');
    expect(result).toBeInstanceOf(Observable);

    result.subscribe((messageEvent) => {
      expect(messageEvent).toEqual({ data: payload });
      done();
    });

    subject.next(payload);
  });
});
