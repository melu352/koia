import { async, ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';

import { SummaryTableSideBarComponent } from './summary-table-side-bar.component';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import {
  MatSlideToggleModule, MatButtonModule, MatIconModule, MatExpansionModule,
  MatFormFieldModule, MatMenuModule, MatSelectModule, MatRadioModule, MatSlideToggle
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Column, SummaryContext, Aggregation, DataType, TimeUnit, ChangeEvent } from 'app/shared/model';
import { HAMMER_LOADER, By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { SideBarController } from 'app/shared/controller';

describe('SummaryTableSideBarComponent', () => {

  let columns: Column[];
  let entries: Object[];
  let context: SummaryContext;
  let component: SummaryTableSideBarComponent;
  let fixture: ComponentFixture<SummaryTableSideBarComponent>;

  beforeAll(() => {
    columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE },
      { name: 'Level', dataType: DataType.TEXT, width: 60 },
      { name: 'Host', dataType: DataType.TEXT, width: 80 },
      { name: 'Path', dataType: DataType.TEXT, width: 200 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70 },
      { name: 'Percent', dataType: DataType.NUMBER, width: 30 }
    ];
    const now = new Date().getTime();
    entries = [
      { Time: now, Level: 'ERROR', Host: 'localhost', Path: 'C:/temp/test.log', Amount: 328, Percent: 12 },
      { Time: now, Level: 'WARN', Host: 'localhost', Path: 'C:/temp/test.log', Amount: 654, Percent: 21 },
      { Time: now, Level: 'INFO', Host: 'localhost', Path: 'C:/temp/test.log', Amount: 891, Percent: 28 }
    ];
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [SummaryTableSideBarComponent],
      imports: [
        MatExpansionModule, MatSlideToggleModule, MatButtonModule, MatIconModule, MatFormFieldModule,
        MatMenuModule, DragDropModule, BrowserAnimationsModule, MatSelectModule, MatRadioModule
      ],
      providers: [
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryTableSideBarComponent);
    component = fixture.componentInstance;
    component.entries$ = of(entries.slice(0));

    context = new SummaryContext(columns.slice(0));
    context.dataColumns = [findColumn('Amount')];
    context.groupByColumns = [findColumn('Time')];
    context.aggregations = [Aggregation.MIN, Aggregation.MAX];

    component.context = context;
    component.elementCount = 3;
    component.elementPosition = 2;
    component.ngOnChanges({ context: new SimpleChange(undefined, context, true) });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize fields', () => {
    expect(component.dataColumns).toEqual(columns.filter(c => c.dataType !== DataType.TIME));
    const currentNonGroupByColumns = columns.filter(n => !context.groupByColumns.includes(n));
    expect(component.availableGroupByColumns).toEqual(currentNonGroupByColumns.filter(c => !context.dataColumns.includes(c)));
    expect(component.selectedGroupByColumns).toEqual(context.groupByColumns);
    expect(component.selectedAggregations).toEqual([Aggregation.MIN, Aggregation.MAX]);
  });

  it('#click on multi expand toggle should close all expansion panels when unchecked', () => {

    // given
    spyOn(component.accordion, 'closeAll');
    const multiExpandToggleElement: MatSlideToggle = fixture.debugElement.query(By.css('.toggle_multi_expand')).nativeElement;
    const multiExpandToggleLabelElement = fixture.debugElement.query(By.css('label')).nativeElement;
    multiExpandToggleLabelElement.click();

    // when
    multiExpandToggleLabelElement.click();
    fixture.detectChanges();

    // then
    expect(multiExpandToggleElement.checked).toBeFalsy();
    expect(component.accordion.closeAll).toHaveBeenCalledTimes(1);
  });

  it('#onAggregationTypeChanged should set context aggreation COUNT when count distinct values', () => {

    // when
    component.onAggregationTypeChanged(true);

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
  });

  it('#onAggregationTypeChanged should define value aggregation when not count distinct values', () => {

    // when
    component.onAggregationTypeChanged(false);

    // then
    expect(context.aggregations).toEqual(SummaryTableSideBarComponent.VALUE_AGGREGATIONS.slice(0, 1));
  });

  it('#onColumnChanged should define aggregation COUNT when text column', () => {

    // when
    component.onColumnChanged(findColumn('Host'));

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
  });

  it('#onColumnChanged should change aggregation when number column and previous aggreation was COUNT', () => {

    // given
    context.aggregations = [Aggregation.COUNT];

    // when
    component.onColumnChanged(findColumn('Amount'));

    // then
    expect(context.aggregations).toEqual(SummaryTableSideBarComponent.VALUE_AGGREGATIONS.slice(0, 1));
  });

  it('#onColumnChanged should keep aggregation when number column and previous aggreation was not COUNT', () => {

    // given
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [Aggregation.SUM, Aggregation.MEDIAN];

    // when
    component.onColumnChanged(findColumn('Percent'));

    // then
    expect(context.aggregations).toEqual([Aggregation.SUM, Aggregation.MEDIAN]);
  });

  it('#addValueGrouping should keep aggregation count when already selected', fakeAsync(() => {

    // given
    context.dataColumns = [findColumn('Amount')];
    context.aggregations = [Aggregation.COUNT];
    let contextChangeEvents = 0;
    context.subscribeToChanges((e: ChangeEvent) => ++contextChangeEvents);

    // when
    component.addValueGrouping('Amount');
    flush();

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
    expect(contextChangeEvents).toBe(1);
  }));

  it('#addValueGrouping should switch to aggregation COUNT when not selected', fakeAsync(() => {

    // given
    const amountColumn = findColumn('Amount');
    context.dataColumns = [amountColumn];
    context.aggregations = [Aggregation.SUM, Aggregation.MEDIAN];
    let contextChangeEvents = 0;
    context.subscribeToChanges((e: ChangeEvent) => ++contextChangeEvents);

    // when
    component.addValueGroupingFor(amountColumn);
    flush();

    // then
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
    expect(contextChangeEvents).toBe(1);
  }));

  it('#click on data column button should invoke #onColumnNameChanged', () => {

    // given
    spyOn(component, 'onColumnChanged');
    const butColumn: HTMLButtonElement = fixture.debugElement.query(By.css('.but_column')).nativeElement;

    // when
    butColumn.click();

    // then
    expect(component.onColumnChanged).toHaveBeenCalled();
  });

  it('#isNumberKey should return value obtained from NumberUtils#isNumberKey', () => {
    expect(component.isNumberKey(new KeyboardEvent('keydown', { key: '1'.toString() }))).toBeTruthy();
    expect(component.isNumberKey(new KeyboardEvent('keydown', { key: '-'.toString() }))).toBeTruthy();
    expect(component.isNumberKey(new KeyboardEvent('keydown', { key: '.'.toString() }))).toBeTruthy();
    expect(component.isNumberKey(new KeyboardEvent('keydown', { key: 'a'.toString() }))).toBeFalsy();
  });

  function findColumn(name: string): Column {
    return JSON.parse(JSON.stringify(columns.find(c => c.name === name)));
  }
});
