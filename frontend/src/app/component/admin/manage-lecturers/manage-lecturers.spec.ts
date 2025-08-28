import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLecturers } from './manage-lecturers';

describe('ManageLecturers', () => {
  let component: ManageLecturers;
  let fixture: ComponentFixture<ManageLecturers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageLecturers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageLecturers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
