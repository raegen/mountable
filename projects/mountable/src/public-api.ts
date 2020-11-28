/*
 * Public API Surface of mountable
 */

export * from './lib/mountable.module';
export {Mountable, StatefulNavigation} from './lib/mountable.decorator';
export {MountableRouterOutlet} from './lib/outlet.directive';
export {MountableStrategy} from './lib/mountable.strategy';
export {getMountable, isMountable} from "./lib/util";
export {Mounter} from './lib/mounter.service';
