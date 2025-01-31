import { async, ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';

import { FlexCanvasComponent } from './flex-canvas.component';
import { Component, NO_ERRORS_SCHEMA, ElementRef, QueryList } from '@angular/core';
import { MatBottomSheet, MatSidenavModule, MatIconModule, MatButtonModule, MatBottomSheetModule, MatMenuModule } from '@angular/material';
import { ResizableDirective, ResizeHandleDirective, ResizeEvent } from 'angular-resizable-element';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationService, ChartMarginService, ConfigService } from 'app/shared/services';
import {
  Column, Status, StatusType, SummaryContext, ChartContext, GraphContext, Route, ChartType,
  DataType, Scene
} from 'app/shared/model';
import { ModelToConfigConverter } from 'app/shared/config';
import { ViewController } from 'app/shared/controller';
import { DBService } from 'app/shared/services/backend';
import { RouterTestingModule } from '@angular/router/testing';
import { MatIconModuleMock } from 'app/shared/test';

@Component({ selector: 'retro-main-toolbar', template: '' })
class MainToolbarComponent { }

@Component({ selector: 'retro-chart-side-bar', template: '' })
class ChartSideBarComponent { }

@Component({ selector: 'retro-graph-side-bar', template: '' })
class GraphSideBarComponent { }

@Component({ selector: 'retro-summary-table-side-bar', template: '' })
class SummaryTableSideBarComponent { }

@Component({ selector: 'retro-summary-table', template: '' })
class SummaryTableComponent { }

@Component({ selector: 'retro-chart', template: '' })
class ChartComponent { }

@Component({ selector: 'retro-graph', template: '' })

class GraphComponent { }

class FakeNotificationService extends NotificationService {

  constructor() {
    super();
  }

  showStatus(bottomSheet: MatBottomSheet, status: Status): void {
  }
}

describe('FlexCanvasComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: Object[];
  let fixture: ComponentFixture<FlexCanvasComponent>;
  let component: FlexCanvasComponent;
  const dbService = new DBService(null);
  const configService = new ConfigService(dbService);
  const notificationService = new FakeNotificationService();

  beforeAll(() => {
    now = new Date().getTime();
    const columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, format: 'yyyy-MM-dd HH:mm:ss SSS', indexed: true },
      { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
      { name: 'Data', dataType: DataType.TEXT, width: 500, indexed: false },
      { name: 'Host', dataType: DataType.TEXT, width: 80, indexed: true },
      { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true }
    ];
    scene = createScene('1', columns);
    entries = [
      { ID: 1, Time: now - 1000, Level: 'INFO', Data: 'INFO line one', Host: 'server1', Path: '/opt/log/info.log', Amount: 10 },
      { ID: 2, Time: now - 2000, Level: 'INFO', Data: 'INFO line two', Host: 'server1', Path: '/opt/log/info.log', Amount: 20 },
      { ID: 3, Time: now - 3000, Level: 'INFO', Data: 'INFO line three', Host: 'server1', Path: '/opt/log/info.log', Amount: 30 },
      { ID: 4, Time: now - 4000, Level: 'WARN', Data: 'WARN line one', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 40 },
      { ID: 5, Time: now - 5000, Level: 'WARN', Data: 'WARN line two', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 50 },
      { ID: 6, Time: now - 6000, Level: 'WARN', Data: 'WARN line three', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 60 },
      { ID: 7, Time: now - 7000, Level: 'ERROR', Data: 'ERROR line one', Host: 'server2', Path: '/var/log/error.log', Amount: 70 },
      { ID: 8, Time: now - 8000, Level: 'ERROR', Data: 'ERROR line two', Host: 'server2', Path: '/var/log/error.log', Amount: 80 },
      { ID: 9, Time: now - 9000, Level: 'ERROR', Data: 'ERROR line three', Host: 'server2', Path: '/var/log/error.log', Amount: 90 },
    ];
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [
        FlexCanvasComponent, MainToolbarComponent, ChartSideBarComponent, GraphSideBarComponent, SummaryTableSideBarComponent,
        SummaryTableComponent, ChartComponent, GraphComponent, ResizableDirective, ResizeHandleDirective
      ],
      imports: [
        MatSidenavModule, MatButtonModule, MatIconModule, BrowserAnimationsModule, MatBottomSheetModule, RouterTestingModule,
        MatMenuModule
      ],
      providers: [
        { provide: MatBottomSheet, useClass: MatBottomSheet },
        { provide: DBService, useValue: dbService },
        { provide: ConfigService, useValue: configService },
        { provide: ChartMarginService, useClass: ChartMarginService },
        { provide: NotificationService, useValue: notificationService }
      ]
    })
      .overrideModule(MatIconModule, MatIconModuleMock.override())
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(FlexCanvasComponent);
    component = fixture.componentInstance;
    spyOn(notificationService, 'showStatus').and.stub();
    spyOn(dbService, 'getActiveScene').and.returnValue(scene);
    spyOn(dbService, 'findEntries').and.returnValue(of(entries.slice(0)));
    fixture.detectChanges();
    flush();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial entries', () => {
    expect(dbService.findEntries).toHaveBeenCalled();
    component.entries$.subscribe(e => {
      expect(e).toEqual(entries);
    })
  });

  it('#resizableEdgesOf should return bottom/right-resizable when summary context', () => {

    // when
    const edges = component.resizableEdgesOf(new SummaryContext(scene.columns));

    // then
    expect(edges).toEqual({ bottom: true, right: true, top: false, left: false });
  });

  it('#resizableEdgesOf should return bottom/right-resizable when graph context', () => {

    // when
    const edges = component.resizableEdgesOf(new GraphContext(scene.columns));

    // then
    expect(edges).toEqual({ bottom: true, right: true, top: false, left: false });
  });

  it('#resizableEdgesOf should return bottom/right-resizable when chart context', () => {

    // when
    const chartContext = new ChartContext(scene.columns, ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    const edges = component.resizableEdgesOf(chartContext);

    // then
    expect(edges).toEqual({ bottom: true, right: true, top: false, left: false });
  });

  it('#resizableEdgesOf should return non-resizable when chart context and showing margins', () => {

    // given
    const chartContext = new ChartContext(scene.columns, ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    chartContext.toggleShowResizableMargin();

    // when
    const edges = component.resizableEdgesOf(chartContext);

    // then
    expect(edges).toEqual({ bottom: false, right: false, top: false, left: false });
  });

  it('#addSummaryTable should add summary context', () => {

    // when
    component.addGraph();
    component.addSummaryTable();

    // then
    expect(component.elementContexts.length).toBe(2);
    const context = component.elementContexts[1];
    expect(component.isSummaryContext(context)).toBeTruthy();
    expect(context instanceof SummaryContext).toBeTruthy();
  });

  it('#addChart should add chart context', () => {

    // when
    component.addChart();
    component.addChart();

    // then
    expect(component.elementContexts.length).toBe(2);
    const context = component.elementContexts[1];
    expect(component.isChartContext(context)).toBeTruthy();
    expect(context instanceof ChartContext).toBeTruthy();
  });

  it('#addGraph should add graph context', () => {

    // when
    component.addSummaryTable();
    component.addGraph();

    // then
    expect(component.elementContexts.length).toBe(2);
    const context = component.elementContexts[1];
    expect(component.isGraphContext(context)).toBeTruthy();
    expect(context instanceof GraphContext).toBeTruthy();
  });

  it('#validateElementResize should return false when width is to small', () => {

    // given
    const width = FlexCanvasComponent.MIN_DIM_PX - 1;
    const resizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: 1000, width: width },
      edges: null
    }

    // when
    const validation = component.validateElementResize(resizeEvent);

    // then
    expect(validation).toBeFalsy();
  });

  it('#validateElementResize should return false when height is to small', () => {

    // given
    const height = FlexCanvasComponent.MIN_DIM_PX - 1;
    const resizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: height, width: 1000 },
      edges: null
    }

    // when
    const validation = component.validateElementResize(resizeEvent);

    // then
    expect(validation).toBeFalsy();
  });

  it('#validateElementResize should return true when width and height are fine', () => {

    // given
    const resizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: 1000, width: 1000 },
      edges: null
    }

    // when
    const validation = component.validateElementResize(resizeEvent);

    // then
    expect(validation).toBeTruthy();
  });

  it('#onResizeEnd should set graph context size', () => {

    // given
    component.addGraph();
    fixture.detectChanges();
    const headerHeight = 26;
    component.elementHeaderDivsRefs = new QueryList<ElementRef<HTMLDivElement>>();
    spyOn(component.elementHeaderDivsRefs, 'toArray').and.returnValue([new ElementRef({ offsetHeight: headerHeight })]);
    const context = component.elementContexts[0];
    spyOn(context, 'setSize');

    // when
    const resizeEvent: ResizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: 200, width: 300 },
      edges: null
    }
    component.onResizeEnd(context, resizeEvent);

    // then
    expect(context.setSize).toHaveBeenCalledWith(300, 200 - headerHeight);
  });

  it('#onResizeEnd should keep summary table context unlimited width when not dragged horizontally', () => {

    // given
    component.addSummaryTable();
    fixture.detectChanges();
    const headerHeight = 26;
    component.elementHeaderDivsRefs = new QueryList<ElementRef<HTMLDivElement>>();
    spyOn(component.elementHeaderDivsRefs, 'toArray').and.returnValue([new ElementRef({ offsetHeight: headerHeight })]);
    const context = <SummaryContext>component.elementContexts[0];
    spyOn(context, 'setSize');
    const resizeEvent: ResizeEvent = {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, height: 200, width: 300 },
      edges: null
    }
    component.onResizeStart(resizeEvent);

    // when
    resizeEvent.rectangle.height = 199;
    component.onResizeEnd(context, resizeEvent);

    // then
    expect(context.setSize).toHaveBeenCalledWith(SummaryContext.UNLIMITED_WITH, 199 - headerHeight);
    expect(context.hasUnlimitedWidth()).toBeTruthy();
  });

  it('#click on config button should open side bar', () => {

    // given
    component.addSummaryTable();
    spyOn(component.sidenav, 'open');
    const grid = fixture.debugElement.nativeElement;
    fixture.detectChanges();
    const configButton: HTMLButtonElement = grid.querySelector('#configButton');

    // when
    configButton.click();
    fixture.detectChanges();

    // then
    expect(component.sidenav.open).toHaveBeenCalled();
  });

  it('#changeElementPosition should move selected element to new position', () => {

    // given
    component.addChart();
    component.addGraph();
    component.configure(new MouseEvent(''), component.elementContexts[0]);

    // when
    component.changeElementPosition(2);

    // then
    expect(component.elementContexts.length).toBe(2);
    expect(component.selectedContextPosition).toBe(2);
    expect(component.elementContexts.indexOf(component.selectedContext)).toBe(1);
  });

  it('#removeElement should remove element', () => {

    // given
    component.addGraph();

    // when
    component.removeElement(component.elementContexts[0]);

    // then
    expect(component.elementContexts.length).toBe(0);
  });

  it('#loadView should notify user when no stored view exists', fakeAsync(() => {

    // given
    spyOn(configService, 'getView').and.returnValue(null);

    // when
    component.loadView();
    tick();

    // then
    expect(notificationService.showStatus).toHaveBeenCalled();
  }));

  it('#loadView should load view', () => {

    // given
    const chartContext = component.addChart();
    chartContext.title = 'Tet Chart';
    chartContext.dataColumns = [findColumn('Level')];
    const graphContext = component.addGraph();
    graphContext.title = 'Tet Graph';
    graphContext.groupByColumns = [findColumn('Level')];
    const summaryContext = component.addSummaryTable();
    summaryContext.title = 'Tet Summary';
    summaryContext.dataColumns = [findColumn('Level')];
    const view = new ModelToConfigConverter().convert(Route.FLEX, component.elementContexts);
    const elementContexts = component.elementContexts;
    component.elementContexts = [];
    spyOn(configService, 'getView').and.returnValue(view);

    // when
    component.loadView();

    // then
    expect(component.elementContexts).toEqual(elementContexts);
  });

  it('#loadView should restore summary context column hierarchy', () => {

    // given
    const summaryContext = component.addSummaryTable();
    summaryContext.dataColumns = [findColumn('Level')];
    summaryContext.groupByColumns = [findColumn('Path'), findColumn('Time'), findColumn('Amount')];
    const view = new ModelToConfigConverter().convert(Route.FLEX, component.elementContexts);
    component.elementContexts = [];
    spyOn(configService, 'getView').and.returnValue(view);

    // when
    component.loadView();

    // then
    expect(component.elementContexts.length).toBe(1);
    const expHierarchyColumns = component.elementContexts[0].groupByColumns.map(c => c.name);
    expect(expHierarchyColumns).toEqual(['Path', 'Time', 'Amount']);
  });

  it('#saveView should warn user when view contains no elements', () => {

    // given
    component.elementContexts = [];

    // when
    component.saveView();

    // then
    const bootomSheet = TestBed.get(MatBottomSheet);
    expect(notificationService.showStatus).toHaveBeenCalledWith(bootomSheet,
      { type: StatusType.WARNING, msg: 'View contains no elements' });
  });

  it('#saveView should notify user about success', fakeAsync(() => {

    // given
    component.addSummaryTable();
    const status = { type: StatusType.SUCCESS, msg: 'View has been saved' };
    const status$ = of(status).toPromise();
    spyOn(configService, 'saveView').and.returnValue(status$);

    // when
    component.saveView();
    tick();

    // then
    const bootomSheet = TestBed.get(MatBottomSheet);
    expect(notificationService.showStatus).toHaveBeenCalledWith(bootomSheet, status);
  }));

  it('#adjustLayout should adjust content margin top', () => {

    // given
    const divHeader = { offsetHeight: 55 };
    component.divHeaderRef = new ElementRef(<HTMLDivElement>divHeader);
    const divContent = { style: { marginTop: '' } };
    component.divContentRef = new ElementRef(<HTMLDivElement>divContent);

    // when
    component.adjustLayout();

    // then
    expect(divContent.style.marginTop).toEqual((55 + ViewController.MARGIN_TOP) + 'px');
  });

  function findColumn(name: string): Column {
    return JSON.parse(JSON.stringify(scene.columns.find(c => c.name === name)));
  }

  function createScene(id: string, columns: Column[]): Scene {
    return {
      _id: id,
      creationTime: now,
      name: 'Scene ' + id,
      shortDescription: 'Scene ' + id + ' Short Description',
      columns: columns,
      database: 'test_data_' + id,
      config: {
        records: [],
        views: []
      }
    };
  }
});
