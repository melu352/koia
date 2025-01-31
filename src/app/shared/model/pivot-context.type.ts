import { ValueGrouping } from './value-grouping.type';
import { Column } from './column.type';

export interface PivotContext {
  timeColumns: Column[];
  negativeColor: string;
  positiveColor: string;
  showRowTotals: boolean;
  showColumnTotals: boolean;
  valueGroupings: ValueGrouping[];
  pivotOptions: Object;
}
