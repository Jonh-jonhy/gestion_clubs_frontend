import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeRole } from './badge-role';

describe('BadgeRole', () => {
  let component: BadgeRole;
  let fixture: ComponentFixture<BadgeRole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeRole],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeRole);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
