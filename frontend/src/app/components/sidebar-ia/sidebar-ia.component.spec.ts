import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarIaComponent } from './sidebar-ia.component';

describe('SidebarIaComponent', () => {
  let component: SidebarIaComponent;
  let fixture: ComponentFixture<SidebarIaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarIaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SidebarIaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
