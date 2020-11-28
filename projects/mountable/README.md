# Mountable

- Angular route reuse strategy infrastructure.
- The missing parts needed to make route reuse strategy viable.

# Usage

- Instead of vendor **router-outlet**, import **MountableModule** and use **mountable-router-outlet**.
- On components(or directives) you want to be reused, apply the **@Mountable()** decorator.
  - that makes them reused and provides two new lifecycle hooks: **ngOnMount** and **ngOnUnmount**, that are called when the component tree is attached/detached to/from the outlet
  - the root route components (ones you declare on the router configuration **Route**) require to have **@Mountabe()** for their tree to be reused. On their descendants, **@Mountable()** has to be added only if you wish to hook into **ngOnMount** and **ngOnUnmount**.
  - both **ngOnMount** and **ngOnUnmount** are called with one argument, namely **StatefulNavigation extends Navigation { restoredState?: any }** event that triggered the route change that attaches/detaches the component.
  - Returning a subscription in **ngOnMount** will automatically unsubscribe from that subscription on Unmount, so it's handy to create all your subscriptions in **ngOnMount** and return them, so they will be created and unsubscribed through the lifecycle.
 
