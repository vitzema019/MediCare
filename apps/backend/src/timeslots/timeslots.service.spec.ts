import { Test, TestingModule } from '@nestjs/testing';
import { TimeslotsService } from './timeslots.service';

describe('TimeslotsService', () => {
  let service: TimeslotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeslotsService],
    }).compile();

    service = module.get<TimeslotsService>(TimeslotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
