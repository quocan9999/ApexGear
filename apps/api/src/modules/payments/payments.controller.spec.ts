import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, Subject } from 'rxjs';
import * as rxjs from 'rxjs';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: { getQrData: jest.fn() } },
        { provide: EventEmitter2, useValue: { on: jest.fn(), off: jest.fn() } },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should filter and map the order.paid event correctly', (done) => {
    const subject = new Subject<any>();
    const fromEventSpy = jest.spyOn(rxjs, 'fromEvent').mockReturnValue(subject);

    const orderId = 'order-1';
    const result = controller.streamPayment(orderId);

    expect(fromEventSpy).toHaveBeenCalledWith(eventEmitter, 'order.paid');
    expect(result).toBeInstanceOf(Observable);

    result.subscribe((messageEvent) => {
      expect(messageEvent).toEqual({
        data: { success: true, orderNumber: 'ORD-123' },
      });
      done();
    });

    subject.next({ orderId: 'other-order', orderNumber: 'ORD-999' });
    subject.next({ orderId, orderNumber: 'ORD-123' });
  });
});
