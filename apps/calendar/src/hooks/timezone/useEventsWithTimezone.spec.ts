import { advanceTo, clear } from 'jest-date-mock';

import { initCalendarStore } from '@src/contexts/calendarStore';
import { createEventCollection } from '@src/controller/base';
import { useEventsWithTimezone } from '@src/hooks/timezone/useEventsWithTimezone';
import EventModel from '@src/model/eventModel';
import { getSystemWallClock, mockSystemTimezone } from '@src/test/helpers';
import { renderHook } from '@src/test/utils';

describe('useEventsWithTimezone', () => {
  let timezoneSpy: jest.SpyInstance | null = null;

  afterEach(() => {
    timezoneSpy?.mockRestore();
    clear();
  });

  function getShownHours(timezoneName: string, start: string, end: string) {
    const store = initCalendarStore({ timezone: { zones: [{ timezoneName }] } });
    const events = createEventCollection(new EventModel({ category: 'time', start, end }));

    const { result } = renderHook(() => useEventsWithTimezone(events), { store });
    const [event] = result.current?.toArray() ?? [];

    return [getSystemWallClock(event.start), getSystemWallClock(event.end)];
  }

  it('shows a January 2027 event at its own time when today is in October 2026', () => {
    timezoneSpy = mockSystemTimezone('America/Vancouver');
    advanceTo(new Date('2026-10-22T12:00:00-07:00').getTime());

    expect(
      getShownHours('America/Vancouver', '2027-01-12T10:00:00-07:00', '2027-01-12T11:00:00-07:00')
    ).toEqual(['2027-01-12 10:00', '2027-01-12 11:00']);
  });

  it('shows 2026 events at their own time when today is in January 2027', () => {
    timezoneSpy = mockSystemTimezone('America/Vancouver');
    advanceTo(new Date('2027-01-05T12:00:00-07:00').getTime());

    expect(
      getShownHours('America/Vancouver', '2026-07-10T10:00:00-07:00', '2026-07-10T11:00:00-07:00')
    ).toEqual(['2026-07-10 10:00', '2026-07-10 11:00']);
    expect(
      getShownHours('America/Vancouver', '2026-11-10T10:00:00-07:00', '2026-11-10T11:00:00-07:00')
    ).toEqual(['2026-11-10 10:00', '2026-11-10 11:00']);
  });

  it('still handles a regular DST change (Los Angeles, summer to winter)', () => {
    timezoneSpy = mockSystemTimezone('America/Los_Angeles');
    advanceTo(new Date('2026-07-01T12:00:00-07:00').getTime());

    expect(
      getShownHours('America/Los_Angeles', '2026-12-10T10:00:00-08:00', '2026-12-10T11:00:00-08:00')
    ).toEqual(['2026-12-10 10:00', '2026-12-10 11:00']);
  });

  it('shows a Toronto event at Toronto time for a Vancouver system', () => {
    timezoneSpy = mockSystemTimezone('America/Vancouver');
    advanceTo(new Date('2027-01-05T12:00:00-07:00').getTime());

    expect(
      getShownHours('America/Toronto', '2027-07-12T10:00:00-04:00', '2027-07-12T11:00:00-04:00')
    ).toEqual(['2027-07-12 10:00', '2027-07-12 11:00']);
  });
});
