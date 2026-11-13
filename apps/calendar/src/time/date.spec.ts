import { advanceTo, clear } from 'jest-date-mock';

import { getSystemWallClock, mockSystemTimezone } from '@src/test/helpers';
import TZDate from '@src/time/date';
import { MS_PER_HOUR } from '@src/time/datetime';

describe('tz()', () => {
  it('should return new TZDate instance following the given timezone name (not applicable to DST)', () => {
    // Given
    const date = new TZDate('2022-03-26T12:00:00+09:00');
    const targetTimezone = 'Europe/Paris';
    const expectedHourDiff = 8;

    // When
    const result = date.tz(targetTimezone); // UTC+1

    // Then
    expect(result).toBeInstanceOf(TZDate);
    expect(result.getTime()).toBe(date.getTime() - expectedHourDiff * MS_PER_HOUR);
  });

  it('should return new TZDate instance following the given timezone name (applicable to DST)', () => {
    // Given
    const date = new TZDate('2022-03-30T12:00:00+09:00');
    const targetTimezone = 'Europe/Paris';
    const expectedHourDiff = 7;

    // When
    const result = date.tz(targetTimezone); // UTC+2

    // Then
    expect(result).toBeInstanceOf(TZDate);
    expect(result.getTime()).toBe(date.getTime() - expectedHourDiff * MS_PER_HOUR);
  });

  it('should return new TZDate instance following the given timezone offset', () => {
    // Given
    const date = new TZDate('2022-03-26T12:00:00+09:00');
    const targetTimezoneOffset = 300;
    const expectedHourDiff = 4;

    // When
    const result = date.tz(targetTimezoneOffset); // UTC+5

    // Then
    expect(result).toBeInstanceOf(TZDate);
    expect(result.getTime()).toBe(date.getTime() - expectedHourDiff * MS_PER_HOUR);
  });
});

describe('local()', () => {
  it(`should return the new TZDate instance having same value if there is no timezone value and it doesn't have timezone offset`, () => {
    // Given
    const date = new TZDate('2022-03-26T12:00:00+09:00');

    // When
    const result = date.local();

    // Then
    expect(result.getTime()).toBe(date.getTime());
  });

  it('should return the new TZDate instance following the local timezone when the origianl instance has timezone offset', () => {
    // Given
    const date = new TZDate('2022-03-26T12:00:00+09:00').tz('Europe/Paris');
    const expectedHourDiff = 8;

    // When
    // Local timezone is 'Asia/Seoul'
    const result = date.local();

    // Then
    expect(result).toBeInstanceOf(TZDate);
    expect(result.getTime()).toBe(date.getTime() + expectedHourDiff * MS_PER_HOUR);
  });

  it('should return the new TZDate following the local timezone with the timezone value', () => {
    // Given
    const date = new TZDate('2022-03-26T12:00:00+01:00'); // already UTC+1
    const givenTimezone = 'Europe/Paris';
    const expectedHourDiff = 8;

    // When
    // Local timezone is 'Asia/Seoul'
    const result = date.local(givenTimezone);

    // Then
    expect(result).toBeInstanceOf(TZDate);
    expect(result.getTime()).toBe(date.getTime() + expectedHourDiff * MS_PER_HOUR);
  });
});

describe('tz() and local() use the system offset at the converted date', () => {
  let timezoneSpy: jest.SpyInstance | null = null;

  afterEach(() => {
    timezoneSpy?.mockRestore();
    clear();
  });

  it.each`
    systemTZ                 | today                          | event                          | primaryTZ                | expected
    ${'America/Vancouver'}   | ${'2026-10-22T12:00:00-07:00'} | ${'2027-01-12T10:00:00-07:00'} | ${'America/Vancouver'}   | ${'2027-01-12 10:00'}
    ${'America/Vancouver'}   | ${'2027-01-05T12:00:00-07:00'} | ${'2026-07-10T10:00:00-07:00'} | ${'America/Vancouver'}   | ${'2026-07-10 10:00'}
    ${'America/Vancouver'}   | ${'2027-01-05T12:00:00-07:00'} | ${'2026-03-02T10:00:00-08:00'} | ${'America/Vancouver'}   | ${'2026-03-02 10:00'}
    ${'America/Vancouver'}   | ${'2027-01-05T12:00:00-07:00'} | ${'2027-07-12T10:00:00-04:00'} | ${'America/Toronto'}     | ${'2027-07-12 10:00'}
    ${'America/Vancouver'}   | ${'2027-01-05T12:00:00-07:00'} | ${'2027-01-12T10:00:00-05:00'} | ${'America/Toronto'}     | ${'2027-01-12 10:00'}
    ${'America/Los_Angeles'} | ${'2026-07-01T12:00:00-07:00'} | ${'2026-12-10T10:00:00-08:00'} | ${'America/Los_Angeles'} | ${'2026-12-10 10:00'}
    ${'America/Los_Angeles'} | ${'2026-12-01T12:00:00-08:00'} | ${'2027-07-10T10:00:00-07:00'} | ${'America/Los_Angeles'} | ${'2027-07-10 10:00'}
  `(
    'shows $event in $primaryTZ at $expected for a $systemTZ system on $today',
    ({ systemTZ, today, event, primaryTZ, expected }) => {
      // Given
      timezoneSpy = mockSystemTimezone(systemTZ);
      advanceTo(new Date(today).getTime());
      const date = new TZDate(event);

      // When
      const zoned = date.tz(primaryTZ);

      // Then
      expect(getSystemWallClock(zoned)).toBe(expected);
      expect(zoned.local().getTime()).toBe(date.getTime());
    }
  );

  it('converts a wall clock time back with the offset at its own date', () => {
    // Given
    timezoneSpy = mockSystemTimezone('America/Los_Angeles');
    advanceTo(new Date('2026-07-01T12:00:00-07:00').getTime());
    const shownAt = new TZDate('2026-12-10T10:00:00-08:00');

    // When
    const result = shownAt.local('America/Toronto');

    // Then
    expect(result.getTime()).toBe(new Date('2026-12-10T10:00:00-05:00').getTime());
  });
});
