import {Type} from "@angular/core";
import {Mounter} from "./mounter.service";

export const NG_MNT_DEF = 'ɵmnt';
export const MOUNTABLE_KEY_NAME = '__ngMountable__';

export const isMountable = (target: Type<any> | any) => target && NG_MNT_DEF in (typeof target === 'function' ? target : target.constructor);

export const getMountable = <T extends {[MOUNTABLE_KEY_NAME]?: Mounter}>(target: T) => target?.[MOUNTABLE_KEY_NAME];
