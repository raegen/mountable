import {NgModule,} from '@angular/core';
import {MountableRouterOutlet} from "./outlet.directive";
import {RouteReuseStrategy} from "@angular/router";
import {MountableStrategy} from "./mountable.strategy";

@NgModule({
  declarations: [MountableRouterOutlet],
  exports: [MountableRouterOutlet],
  providers: [{provide: RouteReuseStrategy, useClass: MountableStrategy}]
})
export class MountableModule {}
