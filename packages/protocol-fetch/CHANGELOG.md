# Changelog

## 1.0.0 (2023-11-28)


### ⚠ BREAKING CHANGES

* imports from `libp2p/fetch` should be updated to `@libp2p/fetch`

### Bug Fixes

* use logging component everywhere ([#2228](https://www.github.com/libp2p/js-libp2p/issues/2228)) ([e5dfde0](https://www.github.com/libp2p/js-libp2p/commit/e5dfde0883191c93903ca552433f177d48adf0b3))


### Code Refactoring

* extract fetch to separate module ([#2223](https://www.github.com/libp2p/js-libp2p/issues/2223)) ([9b19be2](https://www.github.com/libp2p/js-libp2p/commit/9b19be2796c2dbbe207029199b1ac203647744e3))



### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.2 to ^1.0.0
    * @libp2p/interface-internal bumped from ^0.1.5 to ^0.1.10
  * devDependencies
    * @libp2p/logger bumped from ^3.1.0 to ^4.0.0
    * @libp2p/peer-id-factory bumped from ^3.0.8 to ^3.0.9