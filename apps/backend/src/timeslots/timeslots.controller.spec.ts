import { Test, TestingModule } from '@nestjs/testing';
import { TimeslotsController } from './timeslots.controller';

describe('TimeslotsController', () => {
  let controller: TimeslotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeslotsController],
    }).compile();

    controller = module.get<TimeslotsController>(TimeslotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
