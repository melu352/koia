import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphSideBarComponent } from './graph-side-bar.component';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import {
  MatSlideToggleModule, MatButtonModule, MatIconModule, MatExpansionModule,
  MatFormFieldModule, MatMenuModule, MatSelectModule, MatSlideToggle
} from '@angular/material';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Column, GraphContext, DataType, Scene, TimeUnit } from 'app/shared/model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HAMMER_LOADER, By } from '@angular/platform-browser';
import { DBService } from 'app/shared/services/backend';

describe('GraphSideBarComponent', () => {

  let columns: Column[];
  let scene: Scene;
  let context: GraphContext;
  const dbService = new DBService(null);
  let component: GraphSideBarComponent;
  let fixture: ComponentFixture<GraphSideBarComponent>;

  beforeAll(() => {
    columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true },
      { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
      { name: 'Host', dataType: DataType.TEXT, width: 80, indexed: true },
      { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true }
    ];
    scene = createScene('1');
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [GraphSideBarComponent],
      imports: [
        MatExpansionModule, MatSlideToggleModule, MatButtonModule, MatIconModule, MatFormFieldModule,
        MatMenuModule, DragDropModule, BrowserAnimationsModule, MatSelectModule
      ],
      providers: [
        { provide: DBService, useValue: dbService },
        { provide: HAMMER_LOADER, useValue: () => new Promise(() => { }) }
      ]
    }).compileComponents();
    spyOn(dbService, 'getActiveScene').and.returnValue(scene);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphSideBarComponent);
    component = fixture.componentInstance;

    context = new GraphContext(columns);
    context.groupByColumns = [findColumn('Time'), findColumn('Level')];

    component.context = context;
    component.gridColumns = 4;
    component.elementCount = 3;
    component.elementPosition = 2;
    component.ngOnChanges({ context: new SimpleChange( undefined, context, true ) });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize fields', () => {
    const currentNonGroupByColumns = columns.filter(c => !context.groupByColumns.includes(c));
    expect(component.availableGroupByColumns).toEqual(currentNonGroupByColumns);
    expect(component.selectedGroupByColumns).toEqual(context.groupByColumns);
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

  function findColumn(name: string): Column {
    return JSON.parse(JSON.stringify(columns.find(c => c.name === name)));
  }

  function createScene(id: string): Scene {
    return {
      _id: id,
      creationTime: new Date().getTime(),
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
