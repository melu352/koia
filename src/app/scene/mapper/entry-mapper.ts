import { DataType, ColumnPair } from 'app/shared/model';
import { DataTypeUtils, DateTimeUtils, CommonUtils } from 'app/shared/utils';

/**
 * Maps data of different format to target entries and adds an "_id" attribute to each target entry.
 * Target entries are ready to be inserted as document to the CouchDB.
 *
 * - values are NOT written to target entries...
 *   - when they're [[null]] or [[undefined]]
 *   - when they're empty
 *   - when the target value of specified data type cannot be created (parsed)
 * - the "_id" attribute starts at 1 and is incremented for each mapped target entry
 *
 * TODO: target column names must not start with '$' (see https://github.com/apache/couchdb/issues/2028)
 */
export class EntryMapper {

   private idPointer = 1_000_000; // allows for default natural sorting in CouchDB

   constructor(private columnMapping: ColumnPair[], private locale: string) { }

   mapObjects(sourceEntries: Object[]): MappingResult[] {
      let id = this.reserveIDs(sourceEntries.length);
      return this.sanitize(sourceEntries.map(entry => this.mapObject(entry, ++id)));
   }

   mapRows(rows: string[][]): MappingResult[] {
      let id = this.reserveIDs(rows.length);
      return this.sanitize(rows.map(row => this.mapRow(row, ++id)));
   }

   private sanitize(mappingResults: MappingResult[]): MappingResult[] {
      mappingResults
         .filter(mr => Object.keys(mr.entry).length === 1) // contains _id attribute only
         .forEach(mr => mr.entry = undefined);
      return mappingResults
         .filter(mr => mr.entry || mr.errors.length > 0);
   }

   private reserveIDs(count: number): number {
      const currId = this.idPointer;
      this.idPointer += count;
      return currId;
   }

   private mapObject(sourceEntry: Object, id: number): MappingResult {
      const mappingResult = this.newMappingResult(id);
      this.columnMapping.forEach(cp => {
         const sourceValue = sourceEntry[cp.source.name];
         this.mapValue(cp, sourceValue, mappingResult);
      });
      return mappingResult;
   }

   private mapRow(values: string[], id: number): MappingResult {
      const mappingResult = this.newMappingResult(id);
      for (let i = 0; i < this.columnMapping.length; i++) {
         const columnPair = this.columnMapping[i];
         this.mapValue(columnPair, values[i], mappingResult);
      }
      return mappingResult;
   }

   private newMappingResult(id: number): MappingResult {
      return {
         entry: { _id: '' + id },
         errors: []
      };
   }

   private mapValue(columnPair: ColumnPair, sourceValue: any, mappingResult: MappingResult): void {
      if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') { // may be false or 0
         if ((columnPair.source.dataType === DataType.TEXT || columnPair.source.dataType === DataType.NUMBER)
            && columnPair.target.dataType === DataType.TIME) {
            this.mapTextToTime(sourceValue.toString(), columnPair, mappingResult);
         } else {
            const value = DataTypeUtils.toTypedValue(sourceValue, columnPair.target.dataType);
            if (value === undefined) {
               mappingResult.errors.push('Column \'' + columnPair.source.name + '\': Cannot convert "' + this.abbreviate(sourceValue) +
                  '" to ' + columnPair.target.dataType);
            } else {
               mappingResult.entry[columnPair.target.name] = value;
            }
         }
      }
   }

   private mapTextToTime(sourceValue: string, columnPair: ColumnPair, mappingResult: MappingResult) {
      try {
         const date = this.parseDate(sourceValue, columnPair.source.format);
         if (date) {
            mappingResult.entry[columnPair.target.name] = this.roundDownToTargetFormat(date, columnPair.target.format).getTime();
         }
      } catch (e) {
         mappingResult.errors.push('Column \'' + columnPair.source.name + '\': ' + e.message);
      }
   }

   private parseDate(value: string, format: string): Date {
      let date = DateTimeUtils.parseDate(value, format, this.locale);
      if (!date && format) {
         date = DateTimeUtils.parseDate(value, undefined);
      }
      if (!date || isNaN(date.getTime())) {
         const formatHint = format ? ' using format "' + format + '"' : ' without a custom source format';
         throw new Error('Cannot convert "' + this.abbreviate(value) + '" to Time' + formatHint);
      }
      return date;
   }

   /**
    * @returns the down-rounded date, required for correct filtering
    *
    * @see [[TimeRangeFilter]]
    */
   private roundDownToTargetFormat(date: Date, format: string): Date {
      return DateTimeUtils.toDate(date.getTime(), DateTimeUtils.timeUnitFromNgFormat(format));
   }

   private abbreviate(value: any): string {
      if (typeof value !== 'string') {
         value = value.toString();
      }
      return CommonUtils.abbreviate(value, 40);
   }
}

export interface MappingResult {
   entry: Object;
   errors: string[];
}
