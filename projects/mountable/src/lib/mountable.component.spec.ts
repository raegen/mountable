import {ComponentFixture, TestBed} from '@angular/core/testing';

import {Component, ViewChild} from "@angular/core";
import {MountableModule} from "./mountable.module";
import {Mountable} from "./mountable.decorator";
import {Router, RouterModule} from "@angular/router";
import {APP_BASE_HREF} from "@angular/common";
import {MountableRouterOutlet} from "./outlet.directive";

@Component({
  selector: 'mountable-component',
  template: `
    {{ date }}
  `
})
export class RegularComponent {
  date = Date.now();
}

@Mountable()
@Component({
  selector: 'mountable-component',
  template: `
    {{ date }}
  `
})
export class MountableComponent {
  date = Date.now();
}

@Component({
  selector: 'test-bed',
  template: `
    <mountable-router-outlet #outlet></mountable-router-outlet>
  `
})
export class TestBedComponent {
  @ViewChild('outlet', {read: MountableRouterOutlet}) public outlet: MountableRouterOutlet;
  constructor(public router: Router) {
  }
}

describe('MountableComponent', () => {
  let component: TestBedComponent;
  let fixture: ComponentFixture<TestBedComponent>;
  let outlet: MountableRouterOutlet;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MountableModule, RouterModule.forRoot([{
        path: 'mountable',
        component: MountableComponent
      },
        {
          path: '',
          component: RegularComponent
        }])],
      providers: [{provide: APP_BASE_HREF, useValue: '/'}],
      declarations: [TestBedComponent, MountableComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestBedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    outlet = component.outlet;
  });

  it('RegularComponent should get new instance every time -> the date should change upon rerouting to it.', () => {
    return expectAsync(new Promise(resolve => {
      component.router.navigate(['/']).then(() => {
        const date0 = outlet.component?.date;
        component.router.navigate(['mountable']).then(() => {
          component.router.navigate(['/']).then(() => {
            const date1 = outlet.component?.date;

            resolve(date0 !== date1)
          })
        })
      })
    })).toBeResolvedTo(true);
  });

  it('MountableComponent should be instanced only once per route its defined in -> the date should not change upon rerouting to it.', () => {
    return expectAsync(new Promise(resolve => {
      component.router.navigate(['mountable']).then(() => {
        const date0 = outlet.component?.date;
        return component.router.navigate(['/']).then(() => {
          return component.router.navigate(['mountable']).then(() => {
            const date1 = outlet.component?.date;

            resolve(date0 === date1)
          })
        })
      })
    })).toBeResolvedTo(true)
  })
});
