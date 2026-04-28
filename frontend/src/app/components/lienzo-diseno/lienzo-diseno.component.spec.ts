import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LienzoDisenoComponent } from './lienzo-diseno.component';

describe('LienzoDisenoComponent', () => {
  let component: LienzoDisenoComponent;
  let fixture: ComponentFixture<LienzoDisenoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LienzoDisenoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LienzoDisenoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
