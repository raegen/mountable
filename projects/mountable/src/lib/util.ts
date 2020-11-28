import {Type} from "@angular/core";

export const NG_MNT_DEF = 'ɵmnt';
export const MOUNTABLE_KEY_NAME = '__ngMountable__';

export const isMountable = (target: Type<any> | any) => target && NG_MNT_DEF in (typeof target === 'function' ? target : target.constructor);

export const getMountable = (target: any) => target?.[MOUNTABLE_KEY_NAME];
