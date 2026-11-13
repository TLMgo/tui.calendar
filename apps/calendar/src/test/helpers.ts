import TZDate from '@src/time/date';

export function createDate(y: number, M: number, d: number): TZDate {
  const year = String(y);
  let month = String(M);
  let day = String(d);

  if (month.length < 2) {
    month = `0${month}`;
  }
  if (day.length < 2) {
    day = `0${day}`;
  }

  return new TZDate(`${[year, month, day].join('-')}T00:00:00`);
}

// Jest can't change the process timezone from a test file, so tests mock `Date#getTimezoneOffset`.
export const SYSTEM_TIMEZONE_RULES = {
  // BC keeps UTC-7 all year from November 2026 (tzdata 2026e).
  'America/Vancouver': (time: number) => (time < Date.parse('2026-03-08T10:00:00Z') ? 480 : 420),
  'America/Los_Angeles': (time: number) => {
    const isDST =
      (time >= Date.parse('2026-03-08T10:00:00Z') && time < Date.parse('2026-11-01T09:00:00Z')) ||
      (time >= Date.parse('2027-03-14T10:00:00Z') && time < Date.parse('2027-11-07T09:00:00Z'));

    return isDST ? 420 : 480;
  },
};

export function mockSystemTimezone(timezoneName: keyof typeof SYSTEM_TIMEZONE_RULES) {
  const getOffset = SYSTEM_TIMEZONE_RULES[timezoneName];

  return jest.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(function (this: Date) {
    return getOffset(this.getTime());
  });
}

export function getSystemWallClock(date: TZDate) {
  const shown = new Date(date.getTime() - date.toDate().getTimezoneOffset() * 60 * 1000);

  return `${shown.toISOString().slice(0, 10)} ${shown.toISOString().slice(11, 16)}`;
}
