import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material';
import { Status } from '../shared/model';

@Component({
  selector: 'retro-status',
  template: '<div *ngIf="status" >{{ status.msg }}</div>',
  styles: ['div { text-align: center; }']
})
export class StatusComponent {

  status: Status;

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: any) {
    this.status = this.data.status;
  }
}
