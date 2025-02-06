## [@libp2p/peer-id-v2.0.3](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v2.0.2...@libp2p/peer-id-v2.0.3) (2023-03-20)


### Documentation

* update README.md ([#59](https://github.com/libp2p/js-libp2p-peer-id/issues/59)) ([aba6483](https://github.com/libp2p/js-libp2p-peer-id/commit/aba6483dad028ee5c24bfc01135b77568666cfd3))

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.0.1 to ^1.0.2

## [5.0.12](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.11...peer-id-v5.0.12) (2025-02-06)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.10 to ^5.0.11
    * @libp2p/interface bumped from ^2.4.1 to ^2.5.0

## [5.0.11](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.10...peer-id-v5.0.11) (2025-02-03)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.9 to ^5.0.10
    * @libp2p/interface bumped from ^2.4.0 to ^2.4.1

## [5.0.10](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.9...peer-id-v5.0.10) (2025-01-07)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.8 to ^5.0.9
    * @libp2p/interface bumped from ^2.3.0 to ^2.4.0

## [5.0.9](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.8...peer-id-v5.0.9) (2024-12-09)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.7 to ^5.0.8
    * @libp2p/interface bumped from ^2.2.1 to ^2.3.0

## [5.0.8](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.7...peer-id-v5.0.8) (2024-11-18)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.6 to ^5.0.7
    * @libp2p/interface bumped from ^2.2.0 to ^2.2.1

## [5.0.7](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.6...peer-id-v5.0.7) (2024-10-28)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.5 to ^5.0.6
    * @libp2p/interface bumped from ^2.1.3 to ^2.2.0

## [5.0.6](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.5...peer-id-v5.0.6) (2024-10-23)


### Documentation

* update peer id string ([#2780](https://github.com/libp2p/js-libp2p/issues/2780)) ([dc3bdb9](https://github.com/libp2p/js-libp2p/commit/dc3bdb9f67a708dc5b7d72654a2cab5ade2c0d9c))

## [5.0.5](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.4...peer-id-v5.0.5) (2024-10-09)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.4 to ^5.0.5
    * @libp2p/interface bumped from ^2.1.2 to ^2.1.3

## [5.0.4](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.3...peer-id-v5.0.4) (2024-09-24)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.3 to ^5.0.4
    * @libp2p/interface bumped from ^2.1.1 to ^2.1.2

## [5.0.3](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.2...peer-id-v5.0.3) (2024-09-24)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.2 to ^5.0.3
    * @libp2p/interface bumped from ^2.1.0 to ^2.1.1

## [5.0.2](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.1...peer-id-v5.0.2) (2024-09-23)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.1 to ^5.0.2
    * @libp2p/interface bumped from ^2.0.1 to ^2.1.0

## [5.0.1](https://github.com/libp2p/js-libp2p/compare/peer-id-v5.0.0...peer-id-v5.0.1) (2024-09-12)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.0 to ^5.0.1
    * @libp2p/interface bumped from ^2.0.0 to ^2.0.1

## [5.0.0](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.2.4...peer-id-v5.0.0) (2024-09-11)


### ⚠ BREAKING CHANGES

* - `@libp2p/peer-id-factory` has been removed, use `generateKeyPair` and `peerIdFromPrivateKey` instead
* The `.code` property has been removed from most errors, use `.name` instead

### Features

* use `.name` property instead of `.code` for errors ([#2655](https://github.com/libp2p/js-libp2p/issues/2655)) ([0d20426](https://github.com/libp2p/js-libp2p/commit/0d20426fd5ea19b03345c70289bbd692e4348e1f))


### Bug Fixes

* remove private key field from peer id ([#2660](https://github.com/libp2p/js-libp2p/issues/2660)) ([3eeb0c7](https://github.com/libp2p/js-libp2p/commit/3eeb0c705bd58285a6e1ec9fcbb6987c5959d504)), closes [#2659](https://github.com/libp2p/js-libp2p/issues/2659)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^4.1.9 to ^5.0.0
    * @libp2p/interface bumped from ^1.7.0 to ^2.0.0

## [4.2.4](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.2.3...peer-id-v4.2.4) (2024-08-15)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.6.3 to ^1.7.0

## [4.2.3](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.2.2...peer-id-v4.2.3) (2024-08-02)


### Dependencies

* bump aegir from 43.0.3 to 44.0.1 ([#2603](https://github.com/libp2p/js-libp2p/issues/2603)) ([944935f](https://github.com/libp2p/js-libp2p/commit/944935f8dbcc1083e4cb4a02b49a0aab3083d3d9))
* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.6.2 to ^1.6.3

## [4.2.2](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.2.1...peer-id-v4.2.2) (2024-07-29)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.6.1 to ^1.6.2

## [4.2.1](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.2.0...peer-id-v4.2.1) (2024-07-13)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.6.0 to ^1.6.1

## [4.2.0](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.1.4...peer-id-v4.2.0) (2024-07-03)


### Features

* add url peer id ([#2598](https://github.com/libp2p/js-libp2p/issues/2598)) ([b0b6cae](https://github.com/libp2p/js-libp2p/commit/b0b6cae121f23b8b09b36aed6815bddd2ff6e149))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.5.0 to ^1.6.0

## [4.1.4](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.1.3...peer-id-v4.1.4) (2024-06-18)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.4.1 to ^1.5.0

## [4.1.3](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.1.2...peer-id-v4.1.3) (2024-06-07)


### Dependencies

* bump aegir from 42.2.11 to 43.0.1 ([#2571](https://github.com/libp2p/js-libp2p/issues/2571)) ([757fb26](https://github.com/libp2p/js-libp2p/commit/757fb2674f0a3e06fd46d3ff63f7f461c32d47d2))
* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.4.0 to ^1.4.1

## [4.1.2](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.1.1...peer-id-v4.1.2) (2024-05-17)


### Bug Fixes

* update project config ([48444f7](https://github.com/libp2p/js-libp2p/commit/48444f750ebe3f03290bf70e84d7590edc030ea4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.3.1 to ^1.4.0

## [4.1.1](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.1.0...peer-id-v4.1.1) (2024-05-01)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.3.0 to ^1.3.1

## [4.1.0](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.0.10...peer-id-v4.1.0) (2024-04-24)


### Features

* extensible peer ids ([#2496](https://github.com/libp2p/js-libp2p/issues/2496)) ([0d5d966](https://github.com/libp2p/js-libp2p/commit/0d5d966d134fab726c95fbe8fb8e21719d930ef2))


### Documentation

* fix broken links in docs site ([#2497](https://github.com/libp2p/js-libp2p/issues/2497)) ([fd1f834](https://github.com/libp2p/js-libp2p/commit/fd1f8343db030d74cd08bca6a0cffda93532765f)), closes [#2423](https://github.com/libp2p/js-libp2p/issues/2423)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.2.0 to ^1.3.0

## [4.0.10](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.0.9...peer-id-v4.0.10) (2024-04-12)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.6 to ^1.2.0

## [4.0.9](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.0.8...peer-id-v4.0.9) (2024-04-05)


### Bug Fixes

* add @libp2p/record module to monorepo ([#2466](https://github.com/libp2p/js-libp2p/issues/2466)) ([3ffecc5](https://github.com/libp2p/js-libp2p/commit/3ffecc5bfe806a678c1b0228ff830f1811630718))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.5 to ^1.1.6

## [4.0.8](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.0.7...peer-id-v4.0.8) (2024-03-28)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.4 to ^1.1.5

## [4.0.7](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.0.6...peer-id-v4.0.7) (2024-02-27)


### Documentation

* add doc-check to all modules ([#2419](https://github.com/libp2p/js-libp2p/issues/2419)) ([6cdb243](https://github.com/libp2p/js-libp2p/commit/6cdb24362de9991e749f76b16fcd4c130e8106a0))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.3 to ^1.1.4

## [4.0.6](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.0.5...peer-id-v4.0.6) (2024-02-07)


### Bug Fixes

* update patch versions of deps ([#2397](https://github.com/libp2p/js-libp2p/issues/2397)) ([0321812](https://github.com/libp2p/js-libp2p/commit/0321812e731515558f35ae2d53242035a343a21a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.2 to ^1.1.3

## [4.0.5](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.0.4...peer-id-v4.0.5) (2024-01-16)


### Bug Fixes

* mark all packages side-effect free ([#2360](https://github.com/libp2p/js-libp2p/issues/2360)) ([3c96210](https://github.com/libp2p/js-libp2p/commit/3c96210cf6343b21199996918bae3a0f60220046))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.1 to ^1.1.2

## [4.0.4](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.0.3...peer-id-v4.0.4) (2024-01-06)


### Bug Fixes

* remove extra deps ([#2340](https://github.com/libp2p/js-libp2p/issues/2340)) ([53e83ee](https://github.com/libp2p/js-libp2p/commit/53e83eea50410391ec9cff4cd8097210b93894ff))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.0 to ^1.1.1

## [4.0.3](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.0.2...peer-id-v4.0.3) (2023-12-28)


### Bug Fixes

* make peerid optional in peerid.equals ([#2335](https://github.com/libp2p/js-libp2p/issues/2335)) ([f1c1167](https://github.com/libp2p/js-libp2p/commit/f1c116746ab82b15b93a7875ed1b05861b8c0d32))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.0.2 to ^1.1.0

## [4.0.1](https://github.com/libp2p/js-libp2p/compare/peer-id-v4.0.0...peer-id-v4.0.1) (2023-11-30)


### Bug Fixes

* restore lost commits ([#2268](https://github.com/libp2p/js-libp2p/issues/2268)) ([5775f1d](https://github.com/libp2p/js-libp2p/commit/5775f1df4f5561500e622dc0788fdacbc74e2755))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.0.0 to ^1.0.1

## [4.0.0](https://www.github.com/libp2p/js-libp2p/compare/peer-id-v3.0.6...peer-id-v4.0.0) (2023-11-28)


### ⚠ BREAKING CHANGES

* imports from `libp2p/identify` need to change to `@libp2p/identify`

### Code Refactoring

* extract identify service into separate module ([#2219](https://www.github.com/libp2p/js-libp2p/issues/2219)) ([72c2f77](https://www.github.com/libp2p/js-libp2p/commit/72c2f775bd85bd4928048dda0fd14740d6fb6a69))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.6 to ^1.0.0

### [3.0.6](https://www.github.com/libp2p/js-libp2p/compare/peer-id-v3.0.5...peer-id-v3.0.6) (2023-11-07)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.5 to ^0.1.6

### [3.0.5](https://www.github.com/libp2p/js-libp2p/compare/peer-id-v3.0.4...peer-id-v3.0.5) (2023-11-03)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.4 to ^0.1.5

### [3.0.4](https://www.github.com/libp2p/js-libp2p/compare/peer-id-v3.0.3...peer-id-v3.0.4) (2023-10-25)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.3 to ^0.1.4

### [3.0.3](https://www.github.com/libp2p/js-libp2p/compare/peer-id-v3.0.2...peer-id-v3.0.3) (2023-10-06)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.2 to ^0.1.3

### [3.0.2](https://www.github.com/libp2p/js-libp2p/compare/peer-id-v3.0.1...peer-id-v3.0.2) (2023-08-14)


### Bug Fixes

* update project config ([9c0353c](https://www.github.com/libp2p/js-libp2p/commit/9c0353cf5a1e13196ca0e7764f87e36478518f69))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.1 to ^0.1.2

### [3.0.1](https://www.github.com/libp2p/js-libp2p/compare/peer-id-v3.0.0...peer-id-v3.0.1) (2023-08-05)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.0 to ^0.1.1

## [3.0.0](https://www.github.com/libp2p/js-libp2p/compare/peer-id-v2.0.3...peer-id-v3.0.0) (2023-07-31)


### ⚠ BREAKING CHANGES

* `stream.stat.*` and `conn.stat.*` properties are now accessed via `stream.*` and `conn.*`
* consolidate interface modules (#1833)

### Features

* merge stat properties into stream/connection objects ([#1856](https://www.github.com/libp2p/js-libp2p/issues/1856)) ([e9cafd3](https://www.github.com/libp2p/js-libp2p/commit/e9cafd3d8ab0f8e0655ff44e04aa41fccc912b51)), closes [#1849](https://www.github.com/libp2p/js-libp2p/issues/1849)


### Bug Fixes

* consolidate interface modules ([#1833](https://www.github.com/libp2p/js-libp2p/issues/1833)) ([4255b1e](https://www.github.com/libp2p/js-libp2p/commit/4255b1e2485d31e00c33efa029b6426246ea23e3))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ~0.0.1 to ^0.1.0

## [@libp2p/peer-id-v2.0.2](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v2.0.1...@libp2p/peer-id-v2.0.2) (2023-02-23)


### Documentation

* Fix example in README.md ([#54](https://github.com/libp2p/js-libp2p-peer-id/issues/54)) ([294a907](https://github.com/libp2p/js-libp2p-peer-id/commit/294a907ef7c13710045cb2224ab2398e78b353df))

## [@libp2p/peer-id-v2.0.1](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v2.0.0...@libp2p/peer-id-v2.0.1) (2023-01-18)


### Trivial Changes

* replace err-code with CodeError ([#45](https://github.com/libp2p/js-libp2p-peer-id/issues/45)) ([06e39f0](https://github.com/libp2p/js-libp2p-peer-id/commit/06e39f0a8ca9e25cd3d055023ae61cde510183f8)), closes [#1269](https://github.com/libp2p/js-libp2p-peer-id/issues/1269)


### Dependencies

* bump aegir from 37.12.1 to 38.1.0 ([#46](https://github.com/libp2p/js-libp2p-peer-id/issues/46)) ([ba54f6a](https://github.com/libp2p/js-libp2p-peer-id/commit/ba54f6a4a35de20528d4c60a2a532c553b9a9a34))

## [@libp2p/peer-id-v2.0.0](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v1.1.18...@libp2p/peer-id-v2.0.0) (2023-01-06)


### ⚠ BREAKING CHANGES

* bump multiformats from 10.0.3 to 11.0.0 and @libp2p/interface-peer-id from 1.0.0 to 2.0.0 (#41)

### Trivial Changes

* remove lerna ([#43](https://github.com/libp2p/js-libp2p-peer-id/issues/43)) ([d458051](https://github.com/libp2p/js-libp2p-peer-id/commit/d458051bfcb7ff83c42ed26e1c12ac3d07bee492))


### Dependencies

* bump multiformats from 10.0.3 to 11.0.0 and @libp2p/interface-peer-id from 1.0.0 to 2.0.0 ([#41](https://github.com/libp2p/js-libp2p-peer-id/issues/41)) ([2aa0f79](https://github.com/libp2p/js-libp2p-peer-id/commit/2aa0f799789b52758651c115b3a021ca67e5c407))

## [@libp2p/peer-id-v1.1.18](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v1.1.17...@libp2p/peer-id-v1.1.18) (2022-12-16)


### Documentation

* publish api docs for all modules ([#39](https://github.com/libp2p/js-libp2p-peer-id/issues/39)) ([861957a](https://github.com/libp2p/js-libp2p-peer-id/commit/861957add8610498bf095d82dd51af0082eae4b5))

## [@libp2p/peer-id-v1.1.17](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v1.1.16...@libp2p/peer-id-v1.1.17) (2022-12-08)


### Bug Fixes

* human readable peer ids in console.log ([#36](https://github.com/libp2p/js-libp2p-peer-id/issues/36)) ([f80d1ea](https://github.com/libp2p/js-libp2p-peer-id/commit/f80d1ea0b6272692de69ed1d224e6cc16d9b84fb))


### Trivial Changes

* fix peer-d typo in readmes ([#31](https://github.com/libp2p/js-libp2p-peer-id/issues/31)) ([2276076](https://github.com/libp2p/js-libp2p-peer-id/commit/2276076650a0e1ecd0954be104eb7269e688b6ec))

## [@libp2p/peer-id-v1.1.16](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v1.1.15...@libp2p/peer-id-v1.1.16) (2022-10-12)


### Trivial Changes

* update project config ([#14](https://github.com/libp2p/js-libp2p-peer-id/issues/14)) ([5c3918c](https://github.com/libp2p/js-libp2p-peer-id/commit/5c3918c61d8346ed1d49094bb592f8c872b7de57))


### Dependencies

* bump uint8arrays, protons and multiformats ([#28](https://github.com/libp2p/js-libp2p-peer-id/issues/28)) ([e270265](https://github.com/libp2p/js-libp2p-peer-id/commit/e27026508b3684e6cb2eb896de19c161dbd21d45))

## [@libp2p/peer-id-v1.1.15](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v1.1.14...@libp2p/peer-id-v1.1.15) (2022-07-26)


### Bug Fixes

* move error creation ([#11](https://github.com/libp2p/js-libp2p-peer-id/issues/11)) ([9d957fb](https://github.com/libp2p/js-libp2p-peer-id/commit/9d957fb141e30cf1064413cd649bb2c8724e935e))

## [@libp2p/peer-id-v1.1.14](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v1.1.13...@libp2p/peer-id-v1.1.14) (2022-07-18)


### Bug Fixes

* Typo in constant name ([#7](https://github.com/libp2p/js-libp2p-peer-id/issues/7)) ([9063b65](https://github.com/libp2p/js-libp2p-peer-id/commit/9063b65ee3a29ca834588e915e490b9ec802647c))

## [@libp2p/peer-id-v1.1.13](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v1.1.12...@libp2p/peer-id-v1.1.13) (2022-06-14)


### Trivial Changes

* **deps:** bump @libp2p/interface-peer-id from 0.0.1 to 1.0.0 ([#2](https://github.com/libp2p/js-libp2p-peer-id/issues/2)) ([69c0c49](https://github.com/libp2p/js-libp2p-peer-id/commit/69c0c495ab04d5b97de27d3ef20e1ee78d5b0056))

## [@libp2p/peer-id-v1.1.12](https://github.com/libp2p/js-libp2p-peer-id/compare/@libp2p/peer-id-v1.1.11...@libp2p/peer-id-v1.1.12) (2022-06-10)


### Trivial Changes

* update interface deps ([#1](https://github.com/libp2p/js-libp2p-peer-id/issues/1)) ([3cf652d](https://github.com/libp2p/js-libp2p-peer-id/commit/3cf652d50ede0d876da46dcb0b1de387126e272a))

## [@libp2p/peer-id-v1.1.11](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.10...@libp2p/peer-id-v1.1.11) (2022-05-20)


### Bug Fixes

* update interfaces ([#215](https://github.com/libp2p/js-libp2p-interfaces/issues/215)) ([72e6890](https://github.com/libp2p/js-libp2p-interfaces/commit/72e6890826dadbd6e7cbba5536bde350ca4286e6))

## [@libp2p/peer-id-v1.1.10](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.9...@libp2p/peer-id-v1.1.10) (2022-04-14)


### Bug Fixes

* add logger methods, fix peer id deserialization ([#194](https://github.com/libp2p/js-libp2p-interfaces/issues/194)) ([f0e1fad](https://github.com/libp2p/js-libp2p-interfaces/commit/f0e1fad42701d73eef4233ec2b9a8aafa0b2ab96))

## [@libp2p/peer-id-v1.1.9](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.8...@libp2p/peer-id-v1.1.9) (2022-04-08)


### Bug Fixes

* swap protobufjs for protons ([#191](https://github.com/libp2p/js-libp2p-interfaces/issues/191)) ([d72b30c](https://github.com/libp2p/js-libp2p-interfaces/commit/d72b30cfca4b9145e0b31db28e8fa3329a180e83))


### Trivial Changes

* update aegir ([#192](https://github.com/libp2p/js-libp2p-interfaces/issues/192)) ([41c1494](https://github.com/libp2p/js-libp2p-interfaces/commit/41c14941e8b67d6601a90b4d48a2776573d55e60))

## [@libp2p/peer-id-v1.1.8](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.7...@libp2p/peer-id-v1.1.8) (2022-03-15)


### Bug Fixes

* simplify transport interface, update interfaces for use with libp2p ([#180](https://github.com/libp2p/js-libp2p-interfaces/issues/180)) ([ec81622](https://github.com/libp2p/js-libp2p-interfaces/commit/ec81622e5b7c6d256e0f8aed6d3695642473293b))

## [@libp2p/peer-id-v1.1.7](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.6...@libp2p/peer-id-v1.1.7) (2022-02-27)


### Bug Fixes

* rename crypto to connection-encrypter ([#179](https://github.com/libp2p/js-libp2p-interfaces/issues/179)) ([d197f55](https://github.com/libp2p/js-libp2p-interfaces/commit/d197f554d7cdadb3b05ed2d6c69fda2c4362b1eb))

## [@libp2p/peer-id-v1.1.6](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.5...@libp2p/peer-id-v1.1.6) (2022-02-27)


### Bug Fixes

* update package config and add connection gater interface ([#178](https://github.com/libp2p/js-libp2p-interfaces/issues/178)) ([c6079a6](https://github.com/libp2p/js-libp2p-interfaces/commit/c6079a6367f004788062df3e30ad2e26330d947b))

## [@libp2p/peer-id-v1.1.5](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.4...@libp2p/peer-id-v1.1.5) (2022-02-18)


### Bug Fixes

* simpler pubsub ([#172](https://github.com/libp2p/js-libp2p-interfaces/issues/172)) ([98715ed](https://github.com/libp2p/js-libp2p-interfaces/commit/98715ed73183b32e4fda3d878a462389548358d9))

## [@libp2p/peer-id-v1.1.4](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.3...@libp2p/peer-id-v1.1.4) (2022-02-17)


### Bug Fixes

* add multistream-select and update pubsub types ([#170](https://github.com/libp2p/js-libp2p-interfaces/issues/170)) ([b9ecb2b](https://github.com/libp2p/js-libp2p-interfaces/commit/b9ecb2bee8f2abc0c41bfcf7bf2025894e37ddc2))

## [@libp2p/peer-id-v1.1.3](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.2...@libp2p/peer-id-v1.1.3) (2022-02-12)


### Bug Fixes

* hide implementations behind factory methods ([#167](https://github.com/libp2p/js-libp2p-interfaces/issues/167)) ([2fba080](https://github.com/libp2p/js-libp2p-interfaces/commit/2fba0800c9896af6dcc49da4fa904bb4a3e3e40d))

## [@libp2p/peer-id-v1.1.2](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.1...@libp2p/peer-id-v1.1.2) (2022-02-11)


### Bug Fixes

* simpler topologies ([#164](https://github.com/libp2p/js-libp2p-interfaces/issues/164)) ([45fcaa1](https://github.com/libp2p/js-libp2p-interfaces/commit/45fcaa10a6a3215089340ff2eff117d7fd1100e7))

## [@libp2p/peer-id-v1.1.1](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.1.0...@libp2p/peer-id-v1.1.1) (2022-02-10)


### Bug Fixes

* remove node event emitters ([#161](https://github.com/libp2p/js-libp2p-interfaces/issues/161)) ([221fb6a](https://github.com/libp2p/js-libp2p-interfaces/commit/221fb6a024430dc56288d73d8b8ce1aa88427701))

## [@libp2p/peer-id-v1.1.0](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.0.4...@libp2p/peer-id-v1.1.0) (2022-02-09)


### Features

* add peer store/records, and streams are just streams ([#160](https://github.com/libp2p/js-libp2p-interfaces/issues/160)) ([8860a0c](https://github.com/libp2p/js-libp2p-interfaces/commit/8860a0cd46b359a5648402d83870f7ff957222fe))

## [@libp2p/peer-id-v1.0.4](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.0.3...@libp2p/peer-id-v1.0.4) (2022-01-29)


### Bug Fixes

* remove extra fields ([#153](https://github.com/libp2p/js-libp2p-interfaces/issues/153)) ([ccd7cf3](https://github.com/libp2p/js-libp2p-interfaces/commit/ccd7cf3f5ac71337baf516d3b0f6fc724ee0d3b4))

## [@libp2p/peer-id-v1.0.3](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.0.2...@libp2p/peer-id-v1.0.3) (2022-01-15)


### Trivial Changes

* update project config ([#149](https://github.com/libp2p/js-libp2p-interfaces/issues/149)) ([6eb8556](https://github.com/libp2p/js-libp2p-interfaces/commit/6eb85562c0da167d222808da10a7914daf12970b))

## [@libp2p/peer-id-v1.0.2](https://github.com/libp2p/js-libp2p-interfaces/compare/@libp2p/peer-id-v1.0.1...@libp2p/peer-id-v1.0.2) (2022-01-08)


### Trivial Changes

* add semantic release config ([#141](https://github.com/libp2p/js-libp2p-interfaces/issues/141)) ([5f0de59](https://github.com/libp2p/js-libp2p-interfaces/commit/5f0de59136b6343d2411abb2d6a4dd2cd0b7efe4))
* update package versions ([#140](https://github.com/libp2p/js-libp2p-interfaces/issues/140)) ([cd844f6](https://github.com/libp2p/js-libp2p-interfaces/commit/cd844f6e39f4ee50d006e86eac8dadf696900eb5))

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 0.2.0 (2022-01-04)


### Features

* add auto-publish ([7aede5d](https://github.com/libp2p/js-libp2p-interfaces/commit/7aede5df39ea6b5f243348ec9a212b3e33c16a81))
* simpler peer id ([#117](https://github.com/libp2p/js-libp2p-interfaces/issues/117)) ([fa2c4f5](https://github.com/libp2p/js-libp2p-interfaces/commit/fa2c4f5be74a5cfc11489771881e57b4e53bf174))
* update package names ([#133](https://github.com/libp2p/js-libp2p-interfaces/issues/133)) ([337adc9](https://github.com/libp2p/js-libp2p-interfaces/commit/337adc9a9bc0278bdae8cbce9c57d07a83c8b5c2))





# 0.2.0 (2022-01-02)


### Features

* simpler peer id ([#117](https://github.com/libp2p/js-libp2p-interfaces/issues/117)) ([fa2c4f5](https://github.com/libp2p/js-libp2p-interfaces/commit/fa2c4f5be74a5cfc11489771881e57b4e53bf174))
