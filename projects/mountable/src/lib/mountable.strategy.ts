import {ActivatedRouteSnapshot, DetachedRouteHandle, Route, RouteReuseStrategy,} from '@angular/router';
import {isMountable} from "./util";

export class MountableStrategy implements RouteReuseStrategy {
  private handlers: Map<Route, DetachedRouteHandle> = new Map();

  prevCurrent = null;
  prevFuture = null;

  /**
   * Determines if this route (and its subtree) should be detached to be reused later
   * @param route
   */
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    if (!route.routeConfig) {
      return false;
    }
    /** Whether this route should be re used or not */
    return isMountable(route.component);
  }

  identify(route) {
    return route.routeConfig;
  }
  /**
   * Stores the detached route.
   */
  store(route: ActivatedRouteSnapshot, handler: DetachedRouteHandle): void {
    if (handler) {
      this.handlers.set(this.identify(route), handler);
    }
  }

  /**
   * Determines if this route (and its subtree) should be reattached
   * @param route Stores the detached route.
   */
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.handlers.has(this.identify(route));
  }

  /**
   * Retrieves the previously stored route
   */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    if (!route.routeConfig || route.routeConfig.loadChildren) {
      return null;
    }
    return this.handlers.get(this.identify(route));
  }

  /**
   * Determines if a route should be reused
   */
  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot
  ): boolean {
    /**
     * Default reuse strategy by angular asserts based on the following condition
     * @see https://github.com/angular/angular/blob/4.4.6/packages/router/src/route_reuse_strategy.ts#L67
     */
    if (current === this.prevFuture && future === this.prevCurrent) {
      return isMountable(current.component) ||
        isMountable(future.component) || future.routeConfig === current.routeConfig;
    }
    this.prevCurrent = current;
    this.prevFuture = future;

    return future.routeConfig === current.routeConfig;
  }
}
