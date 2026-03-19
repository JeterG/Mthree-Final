import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Swagger } from './swagger';

describe('Swagger', () => {
  let component: Swagger;
  let fixture: ComponentFixture<Swagger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Swagger],
    }).compileComponents();

    fixture = TestBed.createComponent(Swagger);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
