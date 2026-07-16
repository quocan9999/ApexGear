import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
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

  it('should return an observable for payment stream', () => {
    jest.spyOn(rxjs, 'fromEvent').mockReturnValue(new Observable());
    const result = controller.streamPayment('order-1');
    expect(result).toBeInstanceOf(Observable);
  });
});
