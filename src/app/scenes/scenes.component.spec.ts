import { async, ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';

import { ScenesComponent } from './scenes.component';
import {
  MatIconModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatBottomSheetModule,
  MatBottomSheet
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { DBService } from 'app/shared/services/backend';
import { Scene, Status, Route } from 'app/shared/model';
import { NotificationService } from 'app/shared/services';
import { RouterModule, RouteReuseStrategy } from '@angular/router';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';

@Component({ template: '' })
class RawDataComponent { }

class FakeNotificationService extends NotificationService {

  constructor() {
    super();
  }

  showStatus(bottomSheet: MatBottomSheet, status: Status): void {
  }
}

describe('ScenesComponent', () => {

  const appRouteReuseStrategy = new AppRouteReuseStrategy();
  let scenes: Scene[];
  const dbService = new DBService(null);
  const notificationService = new FakeNotificationService();
  let component: ScenesComponent;
  let fixture: ComponentFixture<ScenesComponent>;

  beforeAll(() => {
    scenes = [ createScene('1'), createScene('2'), createScene('3') ];
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScenesComponent, RawDataComponent],
      imports: [BrowserAnimationsModule, RouterTestingModule, MatBottomSheetModule, MatCardModule, FormsModule, MatFormFieldModule,
        MatInputModule, MatButtonModule, MatIconModule, RouterModule.forRoot([{ path: '**', component: RawDataComponent }])],
      providers: [MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: NotificationService, useValue: notificationService },
        { provide: RouteReuseStrategy, useValue: appRouteReuseStrategy },
      ]
    }).compileComponents();
    spyOn(appRouteReuseStrategy, 'clear');
    spyOn(notificationService, 'onSuccess');
    spyOn(notificationService, 'onError');
    spyOn(dbService, 'initBackend').and.returnValue(Promise.resolve());
    spyOn(dbService, 'getActiveScene').and.returnValue(scenes[0]);
    spyOn(dbService, 'findSceneInfos').and.returnValue(Promise.resolve(scenes));
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(ScenesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flush();
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should find ID of active scene', () => {
    expect(component.activeSceneId).toBe(scenes[0]._id);
  });

  it('should read scene infos', () => {
    expect(component.sceneInfos).toBeDefined();
    expect(component.sceneInfos.length).toBe(3);
  });

  it('new scene button should point to scene component', () => {

    // given
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_new_scene')).nativeElement;

    // when
    const link = htmlButton.getAttribute('ng-reflect-router-link');

    // then
    expect(link).toEqual('/' + Route.SCENE);
  });

  it('#click on delete button should delete scene', fakeAsync(() => {

    // given
    const scene = scenes[0];
    spyOn(dbService, 'deleteScene').and.returnValue(Promise.resolve(null));
    const htmlButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_delete_scene'))[0].nativeElement;

    // when
    htmlButton.click();
    flush();

    // then
    expect(dbService.deleteScene).toHaveBeenCalledWith(scene);
    expect(notificationService.onSuccess).toHaveBeenCalledTimes(1);
  }));

  it('#click on activate scene button should activate scene and switch to raw data component', fakeAsync(() => {

    // given
    spyOn(dbService, 'activateScene').and.returnValue(Promise.resolve(scenes[1]));
    spyOn(component.router, 'navigateByUrl');
    const htmlButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_activate_scene'))[0].nativeElement;

    // when
    htmlButton.click();
    flush();

    // then
    expect(dbService.activateScene).toHaveBeenCalledWith(scenes[1]._id);
    expect(appRouteReuseStrategy.clear).toHaveBeenCalledTimes(1);
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.RAWDATA);
  }));

  it('#click on activate scene button should notify error when error occurs', fakeAsync(() => {

    // given
    spyOn(dbService, 'activateScene').and.returnValue(Promise.reject('cannot activate scene'));
    const htmlButton: HTMLButtonElement = fixture.debugElement.queryAll(By.css('.but_activate_scene'))[0].nativeElement;

    // when
    htmlButton.click();
    flush();

    // then
    expect(dbService.activateScene).toHaveBeenCalledWith(scenes[1]._id);
    expect(appRouteReuseStrategy.clear).toHaveBeenCalledTimes(0);
    expect(notificationService.onError).toHaveBeenCalledTimes(1);
  }));

  it('#click on continue button should switch to raw data component', () => {

    // given
    spyOn(component.router, 'navigateByUrl');
    const htmlButton: HTMLButtonElement = fixture.debugElement.query(By.css('#but_continue')).nativeElement;

    // when
    htmlButton.click();

    // then
    expect(appRouteReuseStrategy.clear).toHaveBeenCalledTimes(0);
    expect(component.router.navigateByUrl).toHaveBeenCalledWith(Route.RAWDATA);
  });

  function createScene(id: string): Scene {
    return {
      _id: id,
      creationTime: new Date().getTime(),
      name: 'Scene ' + id,
      shortDescription: 'Scene ' + id + ' Short Description',
      columns: [],
      database: 'test_data_' + id,
      config: {
        records: [],
        views: []
      }
    };
  }
});
