# Changelog

## [1.0.7](https://github.com/libp2p/js-libp2p/compare/auto-tls-v1.0.6...auto-tls-v1.0.7) (2025-02-06)


### Bug Fixes

* include platform in user agent ([#2942](https://github.com/libp2p/js-libp2p/issues/2942)) ([96f14e4](https://github.com/libp2p/js-libp2p/commit/96f14e429eac84d02504c4b97f183511c8af2add))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.10 to ^5.0.11
    * @libp2p/interface bumped from ^2.4.1 to ^2.5.0
    * @libp2p/interface-internal bumped from ^2.2.4 to ^2.3.0
    * @libp2p/keychain bumped from ^5.0.13 to ^5.0.14
    * @libp2p/utils bumped from ^6.5.0 to ^6.5.1
  * devDependencies
    * @libp2p/logger bumped from ^5.1.7 to ^5.1.8
    * @libp2p/peer-id bumped from ^5.0.11 to ^5.0.12

## [1.0.6](https://github.com/libp2p/js-libp2p/compare/auto-tls-v1.0.5...auto-tls-v1.0.6) (2025-02-04)


### Bug Fixes

* send user agent during auto tls ([#2932](https://github.com/libp2p/js-libp2p/issues/2932)) ([80ddad5](https://github.com/libp2p/js-libp2p/commit/80ddad5bbbed06552d805cab4d341367300a4388))


### Documentation

* fix syntax of example in auto-tls module ([#2938](https://github.com/libp2p/js-libp2p/issues/2938)) ([bf0f74d](https://github.com/libp2p/js-libp2p/commit/bf0f74d662a5219cce7082cc7a3230486325c6e9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface-internal bumped from ^2.2.3 to ^2.2.4
    * @libp2p/utils bumped from ^6.4.0 to ^6.5.0

## [1.0.5](https://github.com/libp2p/js-libp2p/compare/auto-tls-v1.0.4...auto-tls-v1.0.5) (2025-02-03)


### Bug Fixes

* add toStringTag for auto-tls ([#2914](https://github.com/libp2p/js-libp2p/issues/2914)) ([06fc82d](https://github.com/libp2p/js-libp2p/commit/06fc82da85bdd4fdba5bba797135c7e8b2b10c53))


### Documentation

* wss as been replaced with tls/ws and autoNat is mandatory by default ([#2921](https://github.com/libp2p/js-libp2p/issues/2921)) ([827a38a](https://github.com/libp2p/js-libp2p/commit/827a38a3895df6eef2feab4c3a715e093f7e430d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.9 to ^5.0.10
    * @libp2p/interface bumped from ^2.4.0 to ^2.4.1
    * @libp2p/interface-internal bumped from ^2.2.2 to ^2.2.3
    * @libp2p/keychain bumped from ^5.0.12 to ^5.0.13
    * @libp2p/utils bumped from ^6.3.1 to ^6.4.0
  * devDependencies
    * @libp2p/logger bumped from ^5.1.6 to ^5.1.7
    * @libp2p/peer-id bumped from ^5.0.10 to ^5.0.11

## [1.0.4](https://github.com/libp2p/js-libp2p/compare/auto-tls-v1.0.3...auto-tls-v1.0.4) (2025-01-13)


### Bug Fixes

* access components via property ([#2912](https://github.com/libp2p/js-libp2p/issues/2912)) ([c90984e](https://github.com/libp2p/js-libp2p/commit/c90984ec77b7184efa66b8b37d7e0913f1c207ce))

## [1.0.3](https://github.com/libp2p/js-libp2p/compare/auto-tls-v1.0.2...auto-tls-v1.0.3) (2025-01-07)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.8 to ^5.0.9
    * @libp2p/interface bumped from ^2.3.0 to ^2.4.0
    * @libp2p/interface-internal bumped from ^2.2.1 to ^2.2.2
    * @libp2p/keychain bumped from ^5.0.11 to ^5.0.12
    * @libp2p/utils bumped from ^6.3.0 to ^6.3.1
  * devDependencies
    * @libp2p/logger bumped from ^5.1.5 to ^5.1.6
    * @libp2p/peer-id bumped from ^5.0.9 to ^5.0.10

## [1.0.2](https://github.com/libp2p/js-libp2p/compare/auto-tls-v1.0.1...auto-tls-v1.0.2) (2024-12-12)


### Bug Fixes

* update case of arguments sent to registration.libp2p.direct ([#2889](https://github.com/libp2p/js-libp2p/issues/2889)) ([023ea57](https://github.com/libp2p/js-libp2p/commit/023ea575cf70211012990116ccfc6c19bb5f37af))

## [1.0.1](https://github.com/libp2p/js-libp2p/compare/auto-tls-v1.0.0...auto-tls-v1.0.1) (2024-12-10)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface-internal bumped from ^2.2.0 to ^2.2.1

## 1.0.0 (2024-12-09)


### Features

* add auto-confirm option to auto-tls ([#2875](https://github.com/libp2p/js-libp2p/issues/2875)) ([2625cc3](https://github.com/libp2p/js-libp2p/commit/2625cc323b77ed4843d200a3b7022f80eba2e8f8))
* add auto-tls service ([#2798](https://github.com/libp2p/js-libp2p/issues/2798)) ([d866eb5](https://github.com/libp2p/js-libp2p/commit/d866eb5bb8269485364c233119331ca073ff1343))


### Bug Fixes

* add retries to certificate provisioning ([#2841](https://github.com/libp2p/js-libp2p/issues/2841)) ([98b4304](https://github.com/libp2p/js-libp2p/commit/98b43045cb4786defc74e21c637489109377ea35))
* require external confirmation of public addresses ([#2867](https://github.com/libp2p/js-libp2p/issues/2867)) ([d19974d](https://github.com/libp2p/js-libp2p/commit/d19974d93a1015acfca95c2155dbcffc5fd6a6c0))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/crypto bumped from ^5.0.7 to ^5.0.8
    * @libp2p/interface bumped from ^2.2.1 to ^2.3.0
    * @libp2p/interface-internal bumped from ^2.1.1 to ^2.2.0
    * @libp2p/keychain bumped from ^5.0.10 to ^5.0.11
    * @libp2p/utils bumped from ^6.2.1 to ^6.3.0
  * devDependencies
    * @libp2p/logger bumped from ^5.1.4 to ^5.1.5
    * @libp2p/peer-id bumped from ^5.0.8 to ^5.0.9
