import { Component, OnInit, Inject, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Query, Route, PivotContext, Column, Scene, DataType, TimeUnit } from '../shared/model';
import { NotificationService, ExportService, ValueRangeGroupingService, TimeGroupingService, ConfigService } from '../shared/services';
import { IDataFrame, DataFrame } from 'data-forge';
import { CommonUtils, ValueGroupingGenerator, DateTimeUtils } from 'app/shared/utils';
import { MatBottomSheet, MatSidenav } from '@angular/material';
import { PivotOptionsProvider } from './pivot-options-provider';
import { DBService } from 'app/shared/services/backend';
import { Router } from '@angular/router';
import { AbstractComponent } from 'app/shared/controller';
import { Subscription } from 'rxjs';

declare var jQuery: any;

@Component({
  selector: 'retro-pivot-table',
  templateUrl: './pivot-table.component.html',
  styleUrls: ['./pivot-table.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PivotTableComponent extends AbstractComponent implements OnInit {

  static readonly MARGIN_TOP = 10;

  @ViewChild(MatSidenav, undefined) sidenav: MatSidenav;
  @ViewChild('header', undefined) divHeaderRef: ElementRef<HTMLDivElement>;
  @ViewChild('content', undefined) divContentRef: ElementRef<HTMLDivElement>;
  @ViewChild('pivot', undefined) divPivot: ElementRef<HTMLDivElement>;

  readonly route = Route.PIVOT;
  readonly timeUnits = [TimeUnit.MILLISECOND, TimeUnit.SECOND, TimeUnit.MINUTE, TimeUnit.HOUR, TimeUnit.DAY, TimeUnit.MONTH, TimeUnit.YEAR];
  readonly colors = ['#FF3333', '#FF6633', '#FFFF33', '#0080FF', '#00FF00'];
  columns: Column[];
  context: PivotContext;
  loading: boolean;
  computing: boolean;
  baseDataFrame: IDataFrame<number, any>;
  dataFrame: IDataFrame<number, any>;
  allowsForValueGrouping: boolean;
  private scene: Scene;
  private entriesSubscription: Subscription;
  private valueGroupingGenerator = new ValueGroupingGenerator();
  private pivotOptionsProvider = new PivotOptionsProvider();
  private stringifiedValueGroupings: string;

  constructor(@Inject(ElementRef) private cmpElementRef: ElementRef, bottomSheet: MatBottomSheet, private router: Router,
    private dbService: DBService, private configService: ConfigService, private timeGroupingService: TimeGroupingService,
    private valueGropingService: ValueRangeGroupingService, notificationService: NotificationService,
    private exportService: ExportService) {
    super(bottomSheet, notificationService)
  }

  ngOnInit(): void {
    this.context = this.createContext();
    this.scene = this.dbService.getActiveScene();
    if (!this.scene) {
      this.router.navigateByUrl(Route.SCENES);
    } else {
      this.fetchData(new Query());
      this.sidenav.openedStart.subscribe(() => this.stringifiedValueGroupings = JSON.stringify(this.context.valueGroupings));
      this.sidenav.closedStart.subscribe(() => this.onSidenavClosing());
    }
  }

  private onSidenavClosing() {
    if (this.stringifiedValueGroupings !== JSON.stringify(this.context.valueGroupings)) {
      this.refreshOptions();
      this.refreshDataFrameAsync();
    }
  }

  private createContext(): PivotContext {
    return {
      timeColumns: [],
      negativeColor: this.colors[0],
      positiveColor: this.colors[this.colors.length - 1],
      showRowTotals: true,
      showColumnTotals: true,
      valueGroupings: [],
      pivotOptions: null
    };
  }

  fetchData(query: Query): void {
    this.loading = true;
    this.columns = this.scene.columns
      .filter(c => c.indexed)
      .map(c => <Column>CommonUtils.clone(c));
    this.allowsForValueGrouping = this.columns.find(c => c.dataType === DataType.NUMBER) !== undefined;
    this.context.timeColumns = this.columns.filter(c => c.dataType === DataType.TIME);
    if (this.entriesSubscription) {
      this.entriesSubscription.unsubscribe();
    }
    this.entriesSubscription = this.dbService.findEntries(query, true)
      .subscribe(entries => {
        this.loading = false;
        this.computing = true;
        DateTimeUtils.defineTimeUnits(this.context.timeColumns, entries);
        this.baseDataFrame = new DataFrame(entries);
        this.context.valueGroupings = this.valueGroupingGenerator.generate(this.baseDataFrame, this.columns);
        this.refreshDataFrameAsync();
      });
  }

  onTimeUnitChanged(column: Column, timeUnit: TimeUnit): void {
    this.pivotOptionsProvider.replaceTimeColumnsInUse(this.getPivotOptions(), column, column.groupingTimeUnit, timeUnit);
    column.groupingTimeUnit = timeUnit;
    this.refreshDataFrameAsync();
  }

  private refreshDataFrameAsync(): void {
    Promise.resolve().then(() => this.refreshDataFrame());
  }

  private async refreshDataFrame(config?: Object): Promise<void> {
    this.computing = true;
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    this.dataFrame = this.baseDataFrame;
    this.context.timeColumns
      .forEach(
        c => this.dataFrame = this.timeGroupingService.groupByFormattedTimeUnit(this.dataFrame, c));
    this.dataFrame = this.valueGropingService.compute(this.dataFrame, this.context.valueGroupings);
    this.renderPivotTable(config);
  }

  printView(): void {
    window.print();
  }

  loadConfig(): void {
    const context: PivotContext = this.configService.getData(this.scene, Route.PIVOT);
    if (context) {
      this.context = context;
      const pivotOptions = this.pivotOptionsProvider.enrichPivotOptions(context.pivotOptions, this.context,
        () => this.onPivotTableRefreshEnd());
      this.refreshDataFrame(pivotOptions);
    } else {
      this.notifyWarning('There\'s no stored configuration available');
    }
  }

  saveConfig(): void {
    this.context.pivotOptions = this.pivotOptionsProvider.clonedPurgedPivotOptions(this.getPivotOptions());
    const context = <PivotContext>CommonUtils.clone(this.context);
    context.valueGroupings.forEach(d => d.minMaxValues = null);
    this.configService.saveData(this.scene, Route.PIVOT, context)
      .then(s => this.showStatus(s));
  }

  onNegativeColorChanged(color: string): void {
    this.context.negativeColor = color;
    this.onColorChanged();
  }

  onPositiveColorChanged(color: string): void {
    this.context.positiveColor = color;
    this.onColorChanged();
  }

  private onColorChanged(): void {
    this.refreshOptions();
    if (this.pivotOptionsProvider.isHeatmapRendererSelected(this.getPivotOptions())) {
      this.renderPivotTableAsync();
    }
  }

  onShowRowTotalsChanged(): void {
    this.context.showRowTotals = !this.context.showRowTotals;
    this.refreshOptions();
    this.renderPivotTableAsync();
  }

  onShowColumnTotalsChanged(): void {
    this.context.showColumnTotals = !this.context.showColumnTotals;
    this.refreshOptions();
    this.renderPivotTableAsync();
  }

  private refreshOptions(): void {
    this.pivotOptionsProvider.enrichPivotOptions(this.getPivotOptions(), this.context, () => this.onPivotTableRefreshEnd());
  }

  getPivotOptions(): Object {
    return this.getTargetElement().data('pivotUIOptions');
  }

  private renderPivotTableAsync(): void {
    this.computing = true;
    Promise.resolve().then(() => this.renderPivotTable());
  }

  private async renderPivotTable(pivotOptions?: Object): Promise<void> {
    const targetElement = this.getTargetElement();
    await CommonUtils.sleep(100); // releases UI thread for showing progress bar
    while (targetElement.firstChild) {
      targetElement.removeChild(targetElement.firstChild);
    }
    if (pivotOptions) {
      targetElement.pivotUI(this.dataFrame.toArray(), pivotOptions, true);
    } else {
      targetElement.pivotUI(this.dataFrame.toArray(),
        this.pivotOptionsProvider.enrichPivotOptions(undefined, this.context, () => this.onPivotTableRefreshEnd()));
    }
  }

  private getTargetElement(): any {
    return jQuery(this.cmpElementRef.nativeElement).find('#pivot');
  }

  private onPivotTableRefreshEnd(): void {
    this.computing = false;
    this.observePivotTableRefreshStart();
  }

  private observePivotTableRefreshStart() {
    const pivotRendererArea = <HTMLTableElement>this.divPivot.nativeElement.getElementsByClassName('pvtRendererArea')[0];
    const mutationObserver = new MutationObserver((mutations) => {
      if (pivotRendererArea.style.opacity !== '1') {
        this.computing = true; // refresh started
      }
    });
    mutationObserver.observe(pivotRendererArea, { attributeFilter: ['style'], attributes: true });
  }

  exportToExcel() {
    const table = <HTMLTableElement>this.divPivot.nativeElement.getElementsByClassName('pvtTable')[0];
    this.exportService.exportTableAsExcel(table, 'PivotTable');
  }

  adjustLayout() {
    this.divContentRef.nativeElement.style.marginTop =
      (this.divHeaderRef.nativeElement.offsetHeight + PivotTableComponent.MARGIN_TOP) + 'px';
  }
}
