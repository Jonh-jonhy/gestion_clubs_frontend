import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderApp } from './header-app';

describe('HeaderApp', () => {
  let component: HeaderApp;
  let fixture: ComponentFixture<HeaderApp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderApp],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderApp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
