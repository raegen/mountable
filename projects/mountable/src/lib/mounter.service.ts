import {ChangeDetectorRef, forwardRef, Inject, Injectable, Optional, SkipSelf} from "@angular/core";
import {ReplaySubject, Subscription} from "rxjs";
import {distinctUntilChanged} from "rxjs/operators";
import {Navigation, Router} from "@angular/router";
import {MountableRouterOutlet} from "./outlet.directive";
import {MountEvent} from "./mountable.decorator";

@Injectable()
export class Mounter {
  private subscription = new Subscription();
  readonly _mounted = new ReplaySubject<MountEvent>(1);
  readonly mounted: ReplaySubject<MountEvent> = this._mounted.pipe(
    distinctUntilChanged((a, b) => a.mounted === b.mounted)
  ) as ReplaySubject<MountEvent>;

  constructor(
    @SkipSelf()
    @Optional()
    @Inject(forwardRef(() => Mounter))
    private parent: Mounter,
    public router: Router,
    public changeDetectorRef: ChangeDetectorRef,
    @Optional() outlet: MountableRouterOutlet
  ) {
    if (!outlet) {
      // rendered outside of router scope
      this._mounted.next({
        mounted: true,
        navigation:
          router.getCurrentNavigation(),
      });
    } else if (parent) {
      this.subscription.add(
        parent.mounted.subscribe(mounted => {
          this._mounted.next(mounted);
        })
      );
    }
  }

  mount(navigation: Navigation) {
    this._mounted.next({
      mounted: true,
      navigation,
    });
  }

  unmount(navigation: Navigation) {
    this._mounted.next({
      mounted: false,
      navigation,
    });
  }
}

@Injectable()
export class DetachedMounter extends Mounter {
  readonly mounted = new ReplaySubject<MountEvent>(1);
}
