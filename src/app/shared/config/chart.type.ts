import { ViewElement } from './view-element.type';
import { Margin } from 'nvd3';

export interface Chart extends ViewElement {
   chartType: string;
   margin: Margin;
   showLegend: boolean;
   legendPosition: string;
   xLabelRotation: number;
}
