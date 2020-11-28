import {ChangeDetectorRef, forwardRef, Inject, Injectable, NgZone, Optional, SkipSelf} from "@angular/core";
import {ReplaySubject, Subscription} from "rxjs";
import {debounce, distinctUntilChanged, first} from "rxjs/operators";
import {Navigation, Router} from "@angular/router";
import {MountableRouterOutlet} from "./outlet.directive";
import {MountEvent} from "./mountable.decorator";

@Injectable()
export class Mounter {
  private subscription = new Subscription();
  readonly mounted$ = new ReplaySubject<MountEvent>(1);
  readonly _mounted = this.mounted$.pipe(debounce(() => this.ngZone.onStable.pipe(first())))
  readonly mounted: ReplaySubject<MountEvent> = this._mounted.pipe(
    distinctUntilChanged((a, b) => a.mounted === b.mounted)
  ) as ReplaySubject<MountEvent>;

  constructor(
    @SkipSelf()
    @Optional()
    @Inject(forwardRef(() => Mounter))
    private parent: Mounter,
    private ngZone: NgZone,
    public router: Router,
    public changeDetectorRef: ChangeDetectorRef,
    @Optional() outlet: MountableRouterOutlet
  ) {
   if (parent) {
      this.subscription.add(
        parent.mounted.subscribe(mounted => {
          this.mounted$.next(mounted);
        })
      );
    } else if (!outlet) {
     // rendered outside of router scope
     this.mounted$.next({
       mounted: true,
       navigation: null,
     });
   }
  }

  mount(navigation: Navigation) {
    this.mounted$.next({
      mounted: true,
      navigation,
    });
  }

  unmount(navigation: Navigation) {
    this.mounted$.next({
      mounted: false,
      navigation,
    });
  }
}

@Injectable()
export class DetachedMounter extends Mounter {
  readonly mounted = new ReplaySubject<MountEvent>(1);
}
