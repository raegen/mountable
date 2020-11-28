import {
  ChangeDetectionStrategy,
  Provider,
  Type,
  TypeDecorator,
  ɵComponentDef as ComponentDef,
  ɵDirectiveDef as DirectiveDef,
  ɵNG_COMP_DEF as NG_COMP_DEF,
  ɵNG_DIR_DEF as NG_DIR_DEF,
  ɵɵdefineComponent as defineComponent,
  ɵɵdefineDirective as defineDirective,
  ɵɵdirectiveInject as directiveInject,
  ɵɵProvidersFeature as providersFeature,
} from '@angular/core';
import {NG_FACTORY_DEF} from '@angular/core/esm2015/src/render3/fields';
import {Navigation} from '@angular/router';
import {noop, Subscription} from 'rxjs';
import {Cache} from './cache';
import {DetachedMounter, Mounter} from './mounter.service';
import {getMountable, MOUNTABLE_KEY_NAME, NG_MNT_DEF} from './util';

export interface IvyMetadata {
  // @ts-ignore
  [NG_COMP_DEF]?: ComponentDef<any>;
  // @ts-ignore
  [NG_DIR_DEF]?: DirectiveDef<any>;
  // @ts-ignore
  [NG_FACTORY_DEF]?: (...args) => any;
}

export interface MountableTarget<T extends Type<any>> extends IvyMetadata {
  new (...args: any[]): Mountable;
  [NG_MNT_DEF]: MountableMetadata;
}

export interface StatefulNavigation extends Navigation {
  restoredState?: any;
}

export interface MountEvent {
  navigation: StatefulNavigation;
  mounted: boolean;
}

const connectMounter = (
  host: Mountable,
  mounter: Mounter,
  cacheSize: number
) => {
  const cache = new Cache(cacheSize);
  let cycle = new Subscription();
  let navigation = null;
  host[MOUNTABLE_KEY_NAME] = mounter;

  return mounter._mounted.subscribe((mounted: MountEvent) => {
    if (mounted.mounted) {
      cycle.unsubscribe();
      mounter.changeDetectorRef.reattach();
      if (host.ngOnMount) {
        // check cache for navigationId
        const cached = cache.get(mounted.navigation.id);

        cycle = (subscription =>
          subscription instanceof Subscription
            ? subscription
            : new Subscription())(
          host.ngOnMount({
            ...mounted.navigation,
            // if state present for this mountable id (history popstate event), pass it to ngOnMount upon call
            restoredState: cached?.state || null
          })
        );
      }
    } else if (!mounted.mounted) {
      cycle.unsubscribe();
      if (host.ngOnUnmount) {
        const state = host.ngOnUnmount(mounted.navigation);

        if (state !== undefined) {
          // check if ngOnUnmount returned any non-undefined value and if so,
          // add it to cache to enable restoring it upon popstate
          cache.push({
            id: navigation.id,
            state
          });
        }
      }
      mounter.changeDetectorRef.detach();
    }

    navigation = mounted.navigation;
  });
};

export interface OnMount {
  ngOnMount?(
    navigation: StatefulNavigation
  ): Subscription | Subscription[] | void;
}

export interface OnUnmount {
  ngOnUnmount?(navigation: StatefulNavigation);
}

export interface DirectiveDefFeature {
  <T>(directiveDef: DirectiveDef<T>): void;
  ngInherit?: true;
}

const createMountableFeature = (config: MountableMetadata): DirectiveDefFeature => {
  const mountableFeature: DirectiveDefFeature = (componentDef: DirectiveDef<any>) => {
    const factory = componentDef.type[NG_FACTORY_DEF];
    Object.defineProperty(componentDef.type, NG_FACTORY_DEF, {
      value: (...args): Mountable => {
        const instance: Mountable = factory(...args);
        if (!getMountable(instance)) {
          connectMounter(instance, directiveInject(Mounter), config.cache)
        }

        return instance;
      },
      writable: true
    })
  };

  mountableFeature.ngInherit = true;
  return mountableFeature;
};

const getTypes = defs =>
  typeof defs === 'function'
    ? defs().map(definition => definition.type)
    : undefined;

export const extendProvidersFeature = (
  providers: Provider[]
): DirectiveDefFeature => {
  const feature: DirectiveDefFeature = definition => {
    const providersResolver = definition.providersResolver || noop;
    providersFeature(providers, [])(definition);
    const extendProvidersResolver = definition.providersResolver;
    definition.providersResolver = (def, processProvidersFn) => {
      providersResolver(def, processProvidersFn);
      extendProvidersResolver(def, processProvidersFn);
    };
  };

  feature.ngInherit = true;

  return feature;
};

const extendFeatures = {
  [NG_COMP_DEF]: (
    definition: ComponentDef<any>,
    features: DirectiveDefFeature[]
  ): ComponentDef<any> => {
    const {
      type,
      selectors,
      decls,
      vars,
      inputs,
      outputs,
      hostBindings,
      hostVars,
      hostAttrs,
      contentQueries,
      exportAs,
      template,
      consts,
      ngContentSelectors,
      viewQuery,
      encapsulation,
      data,
      styles,
      onPush,
      directiveDefs,
      pipeDefs,
      schemas
    } = definition;

    const directives = getTypes(directiveDefs);
    const pipes = getTypes(pipeDefs);

    return defineComponent({
      type,
      selectors: selectors || undefined,
      decls,
      vars,
      inputs: inputs || undefined,
      outputs: outputs || undefined,
      hostBindings: hostBindings || undefined,
      hostVars: hostVars || undefined,
      hostAttrs: hostAttrs || undefined,
      contentQueries: contentQueries || undefined,
      exportAs: exportAs || undefined,
      template,
      consts: consts || undefined,
      ngContentSelectors: ngContentSelectors || undefined,
      viewQuery: viewQuery || undefined,
      encapsulation: encapsulation || undefined,
      data: data || undefined,
      styles: styles || undefined,
      changeDetection: onPush
        ? ChangeDetectionStrategy.OnPush
        : ChangeDetectionStrategy.Default,
      directives: directives || undefined,
      pipes: pipes || undefined,
      schemas: schemas || undefined,
      features: [...(definition.features || []), ...features]
    });
  },
  [NG_DIR_DEF]: (
    definition: DirectiveDef<any>,
    features: DirectiveDefFeature[]
  ): DirectiveDef<any> => {
    const {
      type,
      selectors,
      inputs,
      outputs,
      hostBindings,
      hostVars,
      hostAttrs,
      contentQueries,
      exportAs,
      viewQuery
    } = definition;

    return defineDirective({
      type,
      selectors: selectors || undefined,
      inputs: inputs || undefined,
      outputs: outputs || undefined,
      hostBindings: hostBindings || undefined,
      hostVars: hostVars || undefined,
      hostAttrs: hostAttrs || undefined,
      contentQueries: contentQueries || undefined,
      exportAs: exportAs || undefined,
      viewQuery: viewQuery || undefined,
      features: [...(definition.features || []), ...features]
    });
  }
};

export function decorateRouteLifecycle<T extends Type<Mountable>>(
  Type: T & {[NG_MNT_DEF]?: MountableMetadata},
  config: MountableMetadata
): MountableTarget<T> {
  const DEF = NG_COMP_DEF in Type ? NG_COMP_DEF : NG_DIR_DEF;

  Object.defineProperty(Type, DEF, {
    value: extendFeatures[DEF](Type[DEF], [
      extendProvidersFeature([
        {
          provide: Mounter,
          useClass: config.detached ? DetachedMounter : Mounter
        }
      ]),
      createMountableFeature(config)
    ]),
    writable: true
  });
  Object.defineProperty(Type, NG_MNT_DEF, {
    value: config
  })

  return Type as MountableTarget<T>;
}

interface MountableMetadata {
  detached: boolean;
  cache: number;
}

export interface Mountable extends OnMount, OnUnmount {
  [MOUNTABLE_KEY_NAME]: Mounter;
}

const CONFIG = { detached: false, cache: 5 };

export function Mountable<T extends Type<Mountable>>(
  config: MountableMetadata = CONFIG
): TypeDecorator {
  return (target: T): MountableTarget<T> =>
    decorateRouteLifecycle(target, config);
}
