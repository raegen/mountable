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
    const navigation = this.router.getCurrentNavigation();
    const detached = super.isActivated ? super.detach() : null;
    if (detached && isMountable(detached.instance)) {
      getMountable(detached.instance).unmount(navigation);
    }

    return detached;
  }

  attach(ref: ComponentRef<any>, activatedRoute: ActivatedRoute): void {
    const navigation = this.router.getCurrentNavigation();
    super.attach(ref, activatedRoute);

    if (isMountable(ref.instance)) {
      getMountable(ref.instance).mount(navigation);
    }
  }

  activateWith(
    activatedRoute: ActivatedRoute,
    resolver: ComponentFactoryResolver | null
  ) {
    const navigation = this.router.getCurrentNavigation();
    super.activateWith(activatedRoute, resolver);
    if (isMountable(this.component)) {
      getMountable(this.component).mount(navigation);
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
