import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSemesters } from './manage-semesters';

describe('ManageSemesters', () => {
  let component: ManageSemesters;
  let fixture: ComponentFixture<ManageSemesters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageSemesters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageSemesters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
