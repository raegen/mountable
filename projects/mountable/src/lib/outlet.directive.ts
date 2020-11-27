import {ComponentFactoryResolver, ComponentRef, Directive} from "@angular/core";
import {ActivatedRoute, RouterOutlet} from "@angular/router";
import {getMountable, isMountable} from "./mountable.decorator";

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
      getMountable(detached.instance).unmount();
    }

    return detached;
  }

  attach(ref: ComponentRef<any>, activatedRoute: ActivatedRoute): void {
    super.attach(ref, activatedRoute);

    if (isMountable(ref.instance)) {
      getMountable(ref.instance).mount();
    }
  }

  activateWith(
    activatedRoute: ActivatedRoute,
    resolver: ComponentFactoryResolver | null
  ) {
    super.activateWith(activatedRoute, resolver);
    if (isMountable(this.component)) {
      getMountable(this.component).mount();
    }
  }
}
