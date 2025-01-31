import { DateTimeUtils } from './date-time-utils';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';
import { TimeUnit, Column, DataType } from '../model';

declare var d3: any;

describe('DateTimeUtils', () => {

  const datePipe = new DatePipe('en-US');
  const now = new Date().getTime();
  const sec = 1_000;
  const min = 60 * sec;
  const hour = 60 * min;
  const day = 24 * hour;

  it('#allTimeUnits should return ascending sorted time units', () => {

    // when
    const timeUnits = DateTimeUtils.allTimeUnits('asc');

    // then
    const expected = [
      TimeUnit.MILLISECOND,
      TimeUnit.SECOND,
      TimeUnit.MINUTE,
      TimeUnit.HOUR,
      TimeUnit.DAY,
      TimeUnit.MONTH,
      TimeUnit.YEAR
    ];
    expect(timeUnits).toEqual(expected);
  });

  it('#allTimeUnits should return descending sorted time units', () => {

    // when
    const timeUnits = DateTimeUtils.allTimeUnits('desc');

    // then
    const expected = [
      TimeUnit.YEAR,
      TimeUnit.MONTH,
      TimeUnit.DAY,
      TimeUnit.HOUR,
      TimeUnit.MINUTE,
      TimeUnit.SECOND,
      TimeUnit.MILLISECOND
    ];
    expect(timeUnits).toEqual(expected);
  });

  it('#toMilliseconds should return milliseconds for single fixed timeunit', () => {
    expect(DateTimeUtils.toMilliseconds(1, TimeUnit.MILLISECOND)).toEqual(1);
    expect(DateTimeUtils.toMilliseconds(1, TimeUnit.SECOND)).toEqual(1_000);
    expect(DateTimeUtils.toMilliseconds(1, TimeUnit.MINUTE)).toEqual(60_000);
    expect(DateTimeUtils.toMilliseconds(1, TimeUnit.HOUR)).toEqual(3_600_000);
    expect(DateTimeUtils.toMilliseconds(1, TimeUnit.DAY)).toEqual(86_400_000);
  });

  it('#toMilliseconds should return milliseconds for multiple fixed timeunit', () => {
    expect(DateTimeUtils.toMilliseconds(3, TimeUnit.MILLISECOND)).toEqual(3);
    expect(DateTimeUtils.toMilliseconds(4, TimeUnit.SECOND)).toEqual(4 * 1_000);
    expect(DateTimeUtils.toMilliseconds(5, TimeUnit.MINUTE)).toEqual(5 * 60_000);
    expect(DateTimeUtils.toMilliseconds(6, TimeUnit.HOUR)).toEqual(6 * 3_600_000);
    expect(DateTimeUtils.toMilliseconds(7, TimeUnit.DAY)).toEqual(7 * 86_400_000);
  });

  it('#toMilliseconds should throw exception for variable timeunit', () => {
    expect(() => DateTimeUtils.toMilliseconds(1, TimeUnit.MONTH))
      .toThrow(new Error('month of variable duration cannot be converted to milliseconds'));
    expect(() => DateTimeUtils.toMilliseconds(1, TimeUnit.YEAR))
      .toThrow(new Error('year of variable duration cannot be converted to milliseconds'));
  });

  it('#isOfFixedDuration should return true', () => {
    expect(DateTimeUtils.isOfFixedDuration(TimeUnit.MILLISECOND)).toBeTruthy();
    expect(DateTimeUtils.isOfFixedDuration(TimeUnit.SECOND)).toBeTruthy();
    expect(DateTimeUtils.isOfFixedDuration(TimeUnit.MINUTE)).toBeTruthy();
    expect(DateTimeUtils.isOfFixedDuration(TimeUnit.HOUR)).toBeTruthy();
    expect(DateTimeUtils.isOfFixedDuration(TimeUnit.DAY)).toBeTruthy();
  });

  it('#isOfFixedDuration should return false', () => {
    expect(DateTimeUtils.isOfFixedDuration(TimeUnit.MONTH)).toBeFalsy();
    expect(DateTimeUtils.isOfFixedDuration(TimeUnit.YEAR)).toBeFalsy();
  });

  it('#largestMatchingTimeUnit should return time unit', () => {
    expect(DateTimeUtils.largestMatchingTimeUnit(1_000, 2)).toBe(TimeUnit.MILLISECOND);
    expect(DateTimeUtils.largestMatchingTimeUnit(1_000, 1)).toBe(TimeUnit.SECOND);
    expect(DateTimeUtils.largestMatchingTimeUnit(60_000, 1)).toBe(TimeUnit.MINUTE);
    expect(DateTimeUtils.largestMatchingTimeUnit(3_600_000, 1)).toBe(TimeUnit.HOUR);
    expect(DateTimeUtils.largestMatchingTimeUnit(86_400_000, 1)).toBe(TimeUnit.DAY);
  });

  it('#countTimeUnits should return one fixed timeunit', () => {
    expect(DateTimeUtils.countTimeUnits(1, TimeUnit.MILLISECOND)).toEqual(1);
    expect(DateTimeUtils.countTimeUnits(1_000, TimeUnit.SECOND)).toEqual(1);
    expect(DateTimeUtils.countTimeUnits(60_000, TimeUnit.MINUTE)).toEqual(1);
    expect(DateTimeUtils.countTimeUnits(3_600_000, TimeUnit.HOUR)).toEqual(1);
    expect(DateTimeUtils.countTimeUnits(86_400_000, TimeUnit.DAY)).toEqual(1);
  });

  it('#countTimeUnits should return many fixed timeunit', () => {
    expect(DateTimeUtils.countTimeUnits(3, TimeUnit.MILLISECOND)).toEqual(3);
    expect(DateTimeUtils.countTimeUnits(4 * 1_000, TimeUnit.SECOND)).toEqual(4);
    expect(DateTimeUtils.countTimeUnits(5 * 60_000, TimeUnit.MINUTE)).toEqual(5);
    expect(DateTimeUtils.countTimeUnits(6 * 3_600_000, TimeUnit.HOUR)).toEqual(6);
    expect(DateTimeUtils.countTimeUnits(7 * 86_400_000, TimeUnit.DAY)).toEqual(7);
  });

  it('#countTimeUnits should throw exception for variable timeunit', () => {
    expect(() => DateTimeUtils.countTimeUnits(100_000_000, TimeUnit.MONTH))
      .toThrow(new Error('cannot count number of months with variable duration'));
    expect(() => DateTimeUtils.countTimeUnits(1_000_000_000, TimeUnit.YEAR))
      .toThrow(new Error('cannot count number of years with variable duration'));
  });

  it('#addTimeUnits should add single fixed timeunit to given time', () => {
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.MILLISECOND)).toEqual(now + 1);
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.SECOND)).toEqual(now + 1_000);
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.MINUTE)).toEqual(now + 60_000);
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.HOUR)).toEqual(now + 3_600_000);
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.DAY)).toEqual(now + 86_400_000);
  });

  it('#addTimeUnits should add many fixed timeunit to given time', () => {
    expect(DateTimeUtils.addTimeUnits(now, 3, TimeUnit.MILLISECOND)).toEqual(now + 3);
    expect(DateTimeUtils.addTimeUnits(now, 4, TimeUnit.SECOND)).toEqual(now + 4 * 1_000);
    expect(DateTimeUtils.addTimeUnits(now, 5, TimeUnit.MINUTE)).toEqual(now + 5 * 60_000);
    expect(DateTimeUtils.addTimeUnits(now, 6, TimeUnit.HOUR)).toEqual(now + 6 * 3_600_000);
    expect(DateTimeUtils.addTimeUnits(now, 7, TimeUnit.DAY)).toEqual(now + 7 * 86_400_000);
  });

  it('#abbreviationOf should return abbreviation of timeunit', () => {
    expect(DateTimeUtils.abbreviationOf(TimeUnit.MILLISECOND)).toEqual('ms');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.SECOND)).toEqual('s');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.MINUTE)).toEqual('m');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.HOUR)).toEqual('h');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.DAY)).toEqual('d');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.MONTH)).toEqual('mo');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.YEAR)).toEqual('y');
  });

  it('#parseDate should return undefined when date is not present', () => {
    expect(DateTimeUtils.parseDate(null, 'dd.MM.yyyy')).toBeUndefined();
    expect(DateTimeUtils.parseDate(undefined, 'dd.MM.yyyy')).toBeUndefined();
  });

  it('#parseDate should return undefined when date is invalid and format is not present', () => {
    expect(DateTimeUtils.parseDate('X', undefined)).toBeUndefined();
    expect(DateTimeUtils.parseDate('A', null)).toBeUndefined();
  });

  it('#parseDate should return undefined when date cannot be parsed', () => {

    // when
    const date = DateTimeUtils.parseDate('xyz', 'dd.MM.yyyy');

    // then
    expect(date).toBeUndefined();
  });

  it('#parseDate should return undefined when date is followed by text', () => {

    // given
    const value = '2019.06.05 11:25:16 abcdef';

    // when
    const date = DateTimeUtils.parseDate(value, 'yyyy-MM-dd HH:mm:ss');

    // then
    expect(date).toBeUndefined();
  });

  it('#parseDate should return undefined when date is among text', () => {

    // given
    const value = 'abcdef 2019.06.05 11:25:16 opyrst';

    // when
    const date = DateTimeUtils.parseDate(value, 'yyyy-MM-dd HH:mm:ss');

    // then
    expect(date).toBeUndefined();
  });

  it('#parseDate should return date when ISO-8601 compliant date but no format is provided', () => {

    // when
    const date = DateTimeUtils.parseDate('01 Jan 1970 00:00:00 GMT', undefined);

    // then
    expect(date.getTime()).toBe(0);
  });

  it('#parseDate should return date when non ISO-8601 with format are provided', () => {

    // when
    const date = DateTimeUtils.parseDate('23.07.2005', 'dd.MM.yyyy');

    // then
    expect(date).toBeDefined();
    expect(date.getFullYear()).toBe(2005);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(23);
  });

  it('#parseDate should return date when non ISO-8601 date with format and locale are provided', () => {

    // when
    const date = DateTimeUtils.parseDate('01 Januar 2019', 'dd MMMM yyyy', 'de');

    // then
    expect(date).toBeDefined();
    expect(date.getFullYear()).toBe(2019);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });

  it('#parseDate should return full date and time when day is leading', () => {

    // when
    const date = DateTimeUtils.parseDate('06.05.2019 11:25:16 123', 'dd.MM.yyyy HH:mm:ss SSS');

    // then
    expect(date).toBeDefined();
    expect(date.getFullYear()).toBe(2019);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(6);
    expect(date.getHours()).toBe(11);
    expect(date.getMinutes()).toBe(25);
    expect(date.getSeconds()).toBe(16);
    expect(date.getMilliseconds()).toBe(123);
  });

  it('#parseDate should return full date and time when year is leading', () => {

    // when
    const date = DateTimeUtils.parseDate('2019.05.06 11:22:33 444', 'yyyy.MM.dd HH:mm:ss SSS');

    // then
    expect(date).toBeDefined();
    expect(date.getFullYear()).toBe(2019);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(6);
    expect(date.getHours()).toBe(11);
    expect(date.getMinutes()).toBe(22);
    expect(date.getSeconds()).toBe(33);
    expect(date.getMilliseconds()).toBe(444);
  });

  it('#toDate should return undefined when time is undefined', () => {
    expect(DateTimeUtils.toDate(undefined, TimeUnit.MILLISECOND)).toBeUndefined();
  });

  it('#toDate should return undefined when time is not a number', () => {
    expect(DateTimeUtils.toDate(Number('x'), TimeUnit.MILLISECOND)).toBeUndefined();
  });

  it('#toDate should return time specific down-rounded date', () => {
    const roundNowDown = f => new Date(Math.floor(now / f) * f);

    expect(DateTimeUtils.toDate(now, TimeUnit.MILLISECOND)).toEqual(new Date(now));
    expect(DateTimeUtils.toDate(now, TimeUnit.SECOND)).toEqual(roundNowDown(1_000));
    expect(DateTimeUtils.toDate(now, TimeUnit.MINUTE)).toEqual(roundNowDown(60_000));
    expect(DateTimeUtils.toDate(now, TimeUnit.HOUR)).toEqual(roundNowDown(3_600_000));
  });

  it('#toDate should return down-rounded day', () => {

    // when
    const d = DateTimeUtils.toDate(now, TimeUnit.DAY)

    // then
    const today = new Date(now);
    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);
    expect(d).toEqual(today);
  });

  it('#toDate should return down-rounded month', () => {

    // when
    const month = DateTimeUtils.toDate(now, TimeUnit.MONTH)

    // then
    const today = new Date(now);
    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);
    today.setDate(1);
    expect(month).toEqual(today);
  });

  it('#toDate should return down-rounded year', () => {

    // when
    const year = DateTimeUtils.toDate(now, TimeUnit.YEAR)

    // then
    const today = new Date(now);
    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);
    today.setDate(1);
    today.setMonth(0);
    expect(year).toEqual(today);
  });

  it('#formatTime should return formatted date/time', () => {
    const time = new Date('2019-01-29T18:24:17').getTime() + 557;

    expect(DateTimeUtils.formatTime(time, TimeUnit.MILLISECOND)).toEqual('29 Jan 2019 18:24:17 557');
    expect(DateTimeUtils.formatTime(time, TimeUnit.SECOND)).toEqual('29 Jan 2019 18:24:17');
    expect(DateTimeUtils.formatTime(time, TimeUnit.MINUTE)).toEqual('29 Jan 2019 18:24');
    expect(DateTimeUtils.formatTime(time, TimeUnit.HOUR)).toEqual('29 Jan 2019 18');
    expect(DateTimeUtils.formatTime(time, TimeUnit.DAY)).toEqual('29 Jan 2019');
    expect(DateTimeUtils.formatTime(time, TimeUnit.MONTH)).toEqual('Jan 2019');
    expect(DateTimeUtils.formatTime(time, TimeUnit.YEAR)).toEqual('2019');
  });

  it('#formatTime should return formatted date/time (verified with angular DatePipe)', () => {
    const ngFormat = timeunit => datePipe.transform(now, DateTimeUtils.ngFormatOf(timeunit));

    expect(DateTimeUtils.formatTime(now, TimeUnit.MILLISECOND)).toEqual(ngFormat(TimeUnit.MILLISECOND));
    expect(DateTimeUtils.formatTime(now, TimeUnit.SECOND)).toEqual(ngFormat(TimeUnit.SECOND));
    expect(DateTimeUtils.formatTime(now, TimeUnit.MINUTE)).toEqual(ngFormat(TimeUnit.MINUTE));
    expect(DateTimeUtils.formatTime(now, TimeUnit.HOUR)).toEqual(ngFormat(TimeUnit.HOUR));
    expect(DateTimeUtils.formatTime(now, TimeUnit.DAY)).toEqual(ngFormat(TimeUnit.DAY));
    expect(DateTimeUtils.formatTime(now, TimeUnit.MONTH)).toEqual(ngFormat(TimeUnit.MONTH));
    expect(DateTimeUtils.formatTime(now, TimeUnit.YEAR)).toEqual(ngFormat(TimeUnit.YEAR));
  });

  it('#timeUnitFromNgFormat should return MILLISECOND when ngFormat is missing', () => {
    expect(DateTimeUtils.timeUnitFromNgFormat(null)).toBe(TimeUnit.MILLISECOND);
    expect(DateTimeUtils.timeUnitFromNgFormat(undefined)).toBe(TimeUnit.MILLISECOND);
  });

  it('#timeUnitFromNgFormat should return MILLISECOND when ngFormat is blank', () => {
    expect(DateTimeUtils.timeUnitFromNgFormat('')).toBe(TimeUnit.MILLISECOND);
    expect(DateTimeUtils.timeUnitFromNgFormat('  ')).toBe(TimeUnit.MILLISECOND);
  });

  it('#timeUnitFromNgFormat should return MILLISECOND when ngFormat is unknown', () => {
    expect(DateTimeUtils.timeUnitFromNgFormat('dd/MM/yyyy')).toBe(TimeUnit.MILLISECOND);
    expect(DateTimeUtils.timeUnitFromNgFormat('dd MMMM yyyy')).toBe(TimeUnit.MILLISECOND);
  });

  it('#timeUnitFromNgFormat should return matching time unit', () => {
    expect(DateTimeUtils.timeUnitFromNgFormat('yyyy')).toBe(TimeUnit.YEAR);
    expect(DateTimeUtils.timeUnitFromNgFormat('MMM yyyy')).toBe(TimeUnit.MONTH);
    expect(DateTimeUtils.timeUnitFromNgFormat('d MMM yyyy')).toBe(TimeUnit.DAY);
    expect(DateTimeUtils.timeUnitFromNgFormat('d MMM yyyy HH')).toBe(TimeUnit.HOUR);
    expect(DateTimeUtils.timeUnitFromNgFormat('d MMM yyyy HH:mm')).toBe(TimeUnit.MINUTE);
    expect(DateTimeUtils.timeUnitFromNgFormat('d MMM yyyy HH:mm:ss')).toBe(TimeUnit.SECOND);
    expect(DateTimeUtils.timeUnitFromNgFormat('d MMM yyyy HH:mm:ss SSS')).toBe(TimeUnit.MILLISECOND);
  });

  it('#ngFormatOf should return moment format', () => {
    expect(DateTimeUtils.ngToMomentFormat('dd.MM.yyyy HH:mm:ss SSS')).toBe('DD.MM.YYYY HH:mm:ss SSS');
  });

  it('#ngFormatOf should undefined when ngFormat is missing', () => {
    expect(DateTimeUtils.ngToMomentFormat(undefined)).toBeUndefined();
    expect(DateTimeUtils.ngToMomentFormat(null)).toBeUndefined();
  });

  it('#ngFormatOf and #momentFormatOf should return compatible date/time format each', () => {
    const ngFormat = timeunit => datePipe.transform(now, DateTimeUtils.ngFormatOf(timeunit));
    const momentFormat = timeunit => moment(now).format(DateTimeUtils.momentFormatOf(timeunit));

    expect(ngFormat(TimeUnit.MILLISECOND)).toEqual(momentFormat(TimeUnit.MILLISECOND));
    expect(ngFormat(TimeUnit.SECOND)).toEqual(momentFormat(TimeUnit.SECOND));
    expect(ngFormat(TimeUnit.MINUTE)).toEqual(momentFormat(TimeUnit.MINUTE));
    expect(ngFormat(TimeUnit.HOUR)).toEqual(momentFormat(TimeUnit.HOUR));
    expect(ngFormat(TimeUnit.DAY)).toEqual(momentFormat(TimeUnit.DAY));
    expect(ngFormat(TimeUnit.MONTH)).toEqual(momentFormat(TimeUnit.MONTH));
    expect(ngFormat(TimeUnit.YEAR)).toEqual(momentFormat(TimeUnit.YEAR));
  });

  it('#listMomentLocals should return locals', () => {

    // when
    const locals = DateTimeUtils.listMomentLocals();

    // then
    expect(locals).toBeDefined();
    expect(locals.length).toBeGreaterThan(0);
  });

  it('#momentFormatOf and #d3FormatOf should return compatible date/time format each', () => {
    const momentFormat = timeunit => moment(now).format(DateTimeUtils.momentFormatOf(timeunit));
    const d3Format = timeunit => d3.time.format(DateTimeUtils.d3FormatOf(timeunit))(new Date(now));

    expect(momentFormat(TimeUnit.MILLISECOND)).toEqual(d3Format(TimeUnit.MILLISECOND));
    expect(momentFormat(TimeUnit.SECOND)).toEqual(d3Format(TimeUnit.SECOND));
    expect(momentFormat(TimeUnit.MINUTE)).toEqual(d3Format(TimeUnit.MINUTE));
    expect(momentFormat(TimeUnit.HOUR)).toEqual(d3Format(TimeUnit.HOUR));
    expect(momentFormat(TimeUnit.DAY)).toEqual(d3Format(TimeUnit.DAY));
    expect(momentFormat(TimeUnit.MONTH)).toEqual(d3Format(TimeUnit.MONTH));
    expect(momentFormat(TimeUnit.YEAR)).toEqual(d3Format(TimeUnit.YEAR));
  });

  it('#d3FormatOf and #ngFormatOf should return compatible date/time format each', () => {
    const d3Format = timeunit => d3.time.format(DateTimeUtils.d3FormatOf(timeunit))(new Date(now));
    const ngFormat = timeunit => datePipe.transform(now, DateTimeUtils.ngFormatOf(timeunit));

    expect(d3Format(TimeUnit.MILLISECOND)).toEqual(ngFormat(TimeUnit.MILLISECOND));
    expect(d3Format(TimeUnit.SECOND)).toEqual(ngFormat(TimeUnit.SECOND));
    expect(d3Format(TimeUnit.MINUTE)).toEqual(ngFormat(TimeUnit.MINUTE));
    expect(d3Format(TimeUnit.HOUR)).toEqual(ngFormat(TimeUnit.HOUR));
    expect(d3Format(TimeUnit.DAY)).toEqual(ngFormat(TimeUnit.DAY));
    expect(d3Format(TimeUnit.MONTH)).toEqual(ngFormat(TimeUnit.MONTH));
    expect(d3Format(TimeUnit.YEAR)).toEqual(ngFormat(TimeUnit.YEAR));
  });

  it('#sortTimeUnits should return same when array is missing', () => {
    expect(DateTimeUtils.sortTimeUnits(null, 'asc')).toBeNull();
    expect(DateTimeUtils.sortTimeUnits(undefined, 'asc')).toBeUndefined();
    expect(DateTimeUtils.sortTimeUnits(null, 'desc')).toBeNull();
    expect(DateTimeUtils.sortTimeUnits(undefined, 'desc')).toBeUndefined();
  });

  it('#sortTimeUnits should return unchanged array when it contains single entry', () => {
    const timeUnits: TimeUnit[] = [TimeUnit.YEAR];
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'asc')).toBe(timeUnits);
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'asc')).toEqual([TimeUnit.YEAR]);
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'desc')).toBe(timeUnits);
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'desc')).toEqual([TimeUnit.YEAR]);
  });

  it('#sortTimeUnits should return same ascending sorted array', () => {
    const timeUnits: TimeUnit[] = [TimeUnit.YEAR, TimeUnit.MILLISECOND, TimeUnit.MINUTE, TimeUnit.DAY];
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'asc')).toBe(timeUnits);
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'asc')).toEqual([TimeUnit.MILLISECOND, TimeUnit.MINUTE, TimeUnit.DAY, TimeUnit.YEAR]);
  });

  it('#sortTimeUnits should return same descending sorted array', () => {
    const timeUnits: TimeUnit[] = [TimeUnit.YEAR, TimeUnit.MILLISECOND, TimeUnit.MINUTE, TimeUnit.DAY];
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'desc')).toBe(timeUnits);
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'desc')).toEqual([ TimeUnit.YEAR, TimeUnit.DAY, TimeUnit.MINUTE, TimeUnit.MILLISECOND]);
  });

  it('#defineTimeUnits should not set time unit when column is not time', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TEXT, width: 10 }
    ];
    const entries = [
      { X: now - sec },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBeUndefined();
  });

  it('#defineTimeUnits should not set time unit when entries are null', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, null);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBeUndefined();
  });

  it('#defineTimeUnits should not set time unit when entries are undefined', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, undefined);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBeUndefined();
  });

  it('#defineTimeUnits should not set time unit when entries are empty', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, []);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBeUndefined();
  });

  it('#defineTimeUnits should set MILLISECOND', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { X: now - sec },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.MILLISECOND);
  });

  it('#defineTimeUnits should set SECOND', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { X: now - min },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.SECOND);
  });

  it('#defineTimeUnits should set MINUTE', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { X: now - hour },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.MINUTE);
  });

  it('#defineTimeUnits should set HOUR', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { X: now - day },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.HOUR);
  });

  it('#defineTimeUnits should set DAY', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { X: now - (10 * day) },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.DAY);
  });

  it('#defineTimeUnits should set distinct time units when multiple time columns are present', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 },
      { name: 'Y', dataType: DataType.TIME, width: 10 },
      { name: 'Z', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { A: 1, X: now, Y: now - (10 * hour) },
      { A: 2, Y: now, Z: now },
      { A: 3, X: now - (10 * day), Z: now - (10 * min) }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.DAY);
    expect(timeColumns[1].groupingTimeUnit).toBe(TimeUnit.HOUR);
    expect(timeColumns[2].groupingTimeUnit).toBe(TimeUnit.MINUTE);
  });

});
