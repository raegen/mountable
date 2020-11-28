import {ComponentFixture, TestBed} from '@angular/core/testing';

import {Component, OnInit, ViewChild} from "@angular/core";
import {MountableModule} from "./mountable.module";
import {Mountable} from "./mountable.decorator";
import {Router, RouterModule} from "@angular/router";
import {APP_BASE_HREF} from "@angular/common";
import {MountableRouterOutlet} from "./outlet.directive";

@Component({
  selector: 'mountable-component',
  template: ``
})
export class RegularComponent implements OnInit {
  hookCalled: number;

  ngOnInit() {
    this.hookCalled = Date.now();
  }
}

@Mountable()
@Component({
  selector: 'mountable-component',
  template: ``
})
export class MountableComponent {
  hookCalled: number;

  ngOnMount() {
    this.hookCalled = Date.now();
  }
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
        const instance = outlet.component;
        component.router.navigate(['mountable']).then(() => {
          component.router.navigate(['/']).then(() => {
            resolve(instance !== outlet.component)
          })
        })
      })
    })).toBeResolvedTo(true);
  });

  it('MountableComponent should be instanced only once per route its defined in -> the date should not change upon rerouting to it.', () => {
    return expectAsync(new Promise(resolve => {
      component.router.navigate(['mountable']).then(() => {
        const instance = outlet.component;
        component.router.navigate(['/']).then(() => {
          component.router.navigate(['mountable']).then(() => {
            resolve(instance === outlet.component)
          })
        })
      })
    })).toBeResolvedTo(true)
  })

  it('RegularComponent ngOnInit should get called every time -> the date should change upon rerouting to it.', () => {
    return expectAsync(new Promise(resolve => {
      component.router.navigate(['/']).then(() => {
        fixture.detectChanges();
        const hookCalled = outlet.component.hookCalled;
        component.router.navigate(['mountable']).then(() => {
          fixture.detectChanges();
          component.router.navigate(['/']).then(() => {
            fixture.detectChanges();
            resolve(hookCalled !== outlet.component.hookCalled)
          })
        })
      })
    })).toBeResolvedTo(true);
  });

  it('MountableComponent ngOnMount should get called every time -> the date should change upon rerouting to it.', () => {
    return expectAsync(new Promise(resolve => {
      component.router.navigate(['mountable']).then(() => {
        fixture.detectChanges();
        const hookCalled = outlet.component.hookCalled;
        component.router.navigate(['/']).then(() => {
          fixture.detectChanges();
          component.router.navigate(['mountable']).then(() => {
            fixture.detectChanges();
            resolve(hookCalled !== outlet.component.hookCalled)
          })
        })
      })
    })).toBeResolvedTo(true)
  })
});
