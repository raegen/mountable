import {
  ChangeDetectionStrategy,
  Provider,
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
import {Cache} from "./cache";
import {DetachedMounter, Mounter} from "./mounter.service";
import {getMountable, MOUNTABLE_KEY_NAME, NG_MNT_DEF} from "./util";

export interface IvyMetadata {
  // @ts-ignore
  [NG_COMP_DEF]?: ComponentDef<any>;
  // @ts-ignore
  [NG_DIR_DEF]?: DirectiveDef<any>;
  // @ts-ignore
  [NG_FACTORY_DEF]?: (...args) => any;
}

export interface MountableTarget extends IvyMetadata, OnMount, OnUnmount {
  new (...args: any[]): Mountable;
  [NG_MNT_DEF]: MountableMetadata;
}

export class MountableTarget {}

export interface StatefulNavigation extends Navigation {
  restoredState?: any;
}

export interface MountEvent {
  navigation: StatefulNavigation;
  mounted: boolean;
}

const connectMounter = (host: Mountable, mounter: Mounter) => {
  const cache = new Cache(5);
  let cycle = new Subscription();
  host[MOUNTABLE_KEY_NAME] = mounter;

  return mounter._mounted.subscribe((mounted: MountEvent) => {
    if (mounted.mounted) {
      cycle.unsubscribe();
      mounter.changeDetectorRef.reattach();
      if (host.ngOnMount) {
        // check cache for navigationId
        const cached = cache.get(mounted.navigation.id);

        cycle = (subscription => subscription instanceof Subscription ? subscription : new Subscription())(host.ngOnMount({
          ...mounted.navigation,
          // if state present for this mountable id (history popstate event), pass it to ngOnMount upon call
          restoredState: cached?.state || null,
        }));
      }
    } else if (!mounted.mounted) {
      cycle.unsubscribe();
      if (host.ngOnUnmount) {
        const state = host.ngOnUnmount(mounted.navigation);

        if (state !== undefined) {
          // check if ngOnUnmount returned any non-undefined value and if so,
          // add it to cache to enable restoring it upon popstate
          cache.push({
            id: mounter.router.getCurrentNavigation()?.id,
            state,
          });
        }
      }
      mounter.changeDetectorRef.detach();
    }
  })
}

export interface OnMount {
  ngOnMount?(
    navigation: StatefulNavigation
  ): Subscription | Subscription[] | void;
}

export interface OnUnmount {
  ngOnUnmount?(navigation: StatefulNavigation);
}

export interface ComponentDefFeature {
  <T>(componentDef: ComponentDef<T>): void;
  ngInherit?: true;
}

const createMountableFeature = (): ComponentDefFeature => {
  const mountableFeature: ComponentDefFeature = (componentDef: DirectiveDef<any>) => {
    const factory = componentDef.type[NG_FACTORY_DEF];
    delete componentDef.type[NG_FACTORY_DEF];
    componentDef.type[NG_FACTORY_DEF] = (...args): Mountable => {
      const instance: Mountable = factory(...args);
      if (!getMountable(instance)) {
        connectMounter(instance, directiveInject(Mounter))
      }

      return instance;
    };
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
): ComponentDefFeature => {
  const feature: ComponentDefFeature = definition => {
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

const defineWithProviders = {
  [NG_COMP_DEF]: (definition: ComponentDef<any>, providers: Provider[]) => {
    const features = definition.features || [];
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
      schemas,
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
      features: [
        ...features,
        extendProvidersFeature(providers),
        createMountableFeature(),
      ],
    });
  },
  [NG_DIR_DEF]: (definition: DirectiveDef<any>, providers: Provider[]) => {
    const features = definition.features || [];
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
      viewQuery,
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
      features: [
        ...features,
        extendProvidersFeature(providers),
        createMountableFeature(),
      ],
    });
  },
};

export function decorateRouteLifecycle(
  declarableType: MountableTarget,
  config: MountableMetadata
): MountableTarget {
  const DEF = NG_COMP_DEF in declarableType ? NG_COMP_DEF : NG_DIR_DEF;

  const definition = declarableType[DEF];
  delete declarableType[DEF];
  declarableType[DEF] = defineWithProviders[DEF](definition, [
    {
      provide: Mounter,
      useClass: config.detached ? DetachedMounter : Mounter,
    },
  ]);

  declarableType[NG_MNT_DEF] = config;

  return declarableType;
}

interface MountableMetadata {
  detached: boolean;
}

export interface Mountable extends OnMount, OnUnmount {
  [MOUNTABLE_KEY_NAME]: Mounter;
}

export function Mountable(
  config: MountableMetadata = { detached: false }
): TypeDecorator {
  return (target: MountableTarget): MountableTarget =>
    decorateRouteLifecycle(target, config);
}
