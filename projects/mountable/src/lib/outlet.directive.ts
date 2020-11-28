import {
  Attribute,
  ChangeDetectorRef,
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  ViewContainerRef
} from "@angular/core";
import {ActivatedRoute, ChildrenOutletContexts, Router, RouterOutlet} from "@angular/router";
import {getMountable, isMountable} from "./util";

@Directive({
  selector: 'mountable-router-outlet',
  exportAs: 'outlet',
})
export class MountableRouterOutlet extends RouterOutlet {
  get component(): any {
    return super.isActivated ? super.component : null;
  }

  detach(): ComponentRef<any> {
    const detached = super.isActivated ? super.detach() : null;
    if (detached && isMountable(detached.instance)) {
      getMountable(detached.instance).unmount(this.router.getCurrentNavigation());
    }

    return detached;
  }

  attach(ref: ComponentRef<any>, activatedRoute: ActivatedRoute): void {
    super.attach(ref, activatedRoute);

    if (isMountable(ref.instance)) {
      getMountable(ref.instance).mount(this.router.getCurrentNavigation());
    }
  }

  activateWith(
    activatedRoute: ActivatedRoute,
    resolver: ComponentFactoryResolver | null
  ) {
    super.activateWith(activatedRoute, resolver);
    if (isMountable(this.component)) {
      getMountable(this.component).mount(this.router.getCurrentNavigation());
    }
  }

  constructor(
    parentContexts: ChildrenOutletContexts,
    location: ViewContainerRef,
    resolver: ComponentFactoryResolver,
    @Attribute('name') name: string,
    changeDetector: ChangeDetectorRef,
    private router: Router
  ) {
    super(parentContexts, location, resolver, name, changeDetector);
  }
}
