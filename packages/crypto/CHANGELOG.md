## [1.0.17](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.16...v1.0.17) (2023-05-05)


### Dependencies

* **dev:** bump aegir from 38.1.8 to 39.0.5 ([#320](https://github.com/libp2p/js-libp2p-crypto/issues/320)) ([f0b4c06](https://github.com/libp2p/js-libp2p-crypto/commit/f0b4c068a23d78b1376865c6adf6cce21ab91196))

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.0.1 to ^1.0.2

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.0.2 to ^1.1.0

## [5.0.11](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.10...crypto-v5.0.11) (2025-02-06)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.4.1 to ^2.5.0

## [5.0.10](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.9...crypto-v5.0.10) (2025-02-03)


### Bug Fixes

* use publicKey.x instead of privateKey.x for Ed25519 keys ([#2926](https://github.com/libp2p/js-libp2p/issues/2926)) ([e2ec7bd](https://github.com/libp2p/js-libp2p/commit/e2ec7bdaae767061c0aa07ea101184608a5072bb))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.4.0 to ^2.4.1

## [5.0.9](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.8...crypto-v5.0.9) (2025-01-07)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.3.0 to ^2.4.0

## [5.0.8](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.7...crypto-v5.0.8) (2024-12-09)


### Dependencies

* bump @stablelib/ed25519 in /packages/crypto/benchmark/ed25519 ([#2855](https://github.com/libp2p/js-libp2p/issues/2855)) ([86a646b](https://github.com/libp2p/js-libp2p/commit/86a646b7fb0efb1c09fdbd068dc9a78653553fcf))
* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.2.1 to ^2.3.0

## [5.0.7](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.6...crypto-v5.0.7) (2024-11-18)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.2.0 to ^2.2.1

## [5.0.6](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.5...crypto-v5.0.6) (2024-10-28)


### Bug Fixes

* use raw asn1js int value to improve performance ([#2788](https://github.com/libp2p/js-libp2p/issues/2788)) ([c4399dc](https://github.com/libp2p/js-libp2p/commit/c4399dcb93b24339a15e152d48009f448fc701d0))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.1.3 to ^2.2.0

## [5.0.5](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.4...crypto-v5.0.5) (2024-10-09)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.1.2 to ^2.1.3

## [5.0.4](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.3...crypto-v5.0.4) (2024-09-24)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.1.1 to ^2.1.2

## [5.0.3](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.2...crypto-v5.0.3) (2024-09-24)


### Bug Fixes

* export transiently referenced types ([#2717](https://github.com/libp2p/js-libp2p/issues/2717)) ([7f7ec82](https://github.com/libp2p/js-libp2p/commit/7f7ec82ae4ee7761360bdfdd294de271feaf1841))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.1.0 to ^2.1.1

## [5.0.2](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.1...crypto-v5.0.2) (2024-09-23)


### Bug Fixes

* update P-521 bit length in Web Crypto ([#2710](https://github.com/libp2p/js-libp2p/issues/2710)) ([67587a2](https://github.com/libp2p/js-libp2p/commit/67587a273d7a65a14b513821ec7b129bf17504cc))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.0.1 to ^2.1.0

## [5.0.1](https://github.com/libp2p/js-libp2p/compare/crypto-v5.0.0...crypto-v5.0.1) (2024-09-12)


### Bug Fixes

* add public/private key type disambiguators ([#2698](https://github.com/libp2p/js-libp2p/issues/2698)) ([18dd3cb](https://github.com/libp2p/js-libp2p/commit/18dd3cb2649412126b995c90e976ed06220c8590))
* correct secp256k1 key length detection in publicKeyFromRaw ([#2697](https://github.com/libp2p/js-libp2p/issues/2697)) ([1210884](https://github.com/libp2p/js-libp2p/commit/1210884edfe724389bb99aaf67042626093ee60b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^2.0.0 to ^2.0.1

## [5.0.0](https://github.com/libp2p/js-libp2p/compare/crypto-v4.1.9...crypto-v5.0.0) (2024-09-11)


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
    * @libp2p/interface bumped from ^1.7.0 to ^2.0.0

## [4.1.9](https://github.com/libp2p/js-libp2p/compare/crypto-v4.1.8...crypto-v4.1.9) (2024-08-15)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.6.3 to ^1.7.0

## [4.1.8](https://github.com/libp2p/js-libp2p/compare/crypto-v4.1.7...crypto-v4.1.8) (2024-08-02)


### Dependencies

* bump aegir from 43.0.3 to 44.0.1 ([#2603](https://github.com/libp2p/js-libp2p/issues/2603)) ([944935f](https://github.com/libp2p/js-libp2p/commit/944935f8dbcc1083e4cb4a02b49a0aab3083d3d9))
* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.6.2 to ^1.6.3

## [4.1.7](https://github.com/libp2p/js-libp2p/compare/crypto-v4.1.6...crypto-v4.1.7) (2024-07-29)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.6.1 to ^1.6.2

## [4.1.6](https://github.com/libp2p/js-libp2p/compare/crypto-v4.1.5...crypto-v4.1.6) (2024-07-13)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.6.0 to ^1.6.1

## [4.1.5](https://github.com/libp2p/js-libp2p/compare/crypto-v4.1.4...crypto-v4.1.5) (2024-07-03)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.5.0 to ^1.6.0

## [4.1.4](https://github.com/libp2p/js-libp2p/compare/crypto-v4.1.3...crypto-v4.1.4) (2024-06-18)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.4.1 to ^1.5.0

## [4.1.3](https://github.com/libp2p/js-libp2p/compare/crypto-v4.1.2...crypto-v4.1.3) (2024-06-07)


### Dependencies

* bump aegir from 42.2.11 to 43.0.1 ([#2571](https://github.com/libp2p/js-libp2p/issues/2571)) ([757fb26](https://github.com/libp2p/js-libp2p/commit/757fb2674f0a3e06fd46d3ff63f7f461c32d47d2))
* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.4.0 to ^1.4.1

## [4.1.2](https://github.com/libp2p/js-libp2p/compare/crypto-v4.1.1...crypto-v4.1.2) (2024-05-17)


### Bug Fixes

* update project config ([48444f7](https://github.com/libp2p/js-libp2p/commit/48444f750ebe3f03290bf70e84d7590edc030ea4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.3.1 to ^1.4.0

## [4.1.1](https://github.com/libp2p/js-libp2p/compare/crypto-v4.1.0...crypto-v4.1.1) (2024-05-01)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.3.0 to ^1.3.1

## [4.1.0](https://github.com/libp2p/js-libp2p/compare/crypto-v4.0.6...crypto-v4.1.0) (2024-04-24)


### Features

* extensible peer ids ([#2496](https://github.com/libp2p/js-libp2p/issues/2496)) ([0d5d966](https://github.com/libp2p/js-libp2p/commit/0d5d966d134fab726c95fbe8fb8e21719d930ef2))


### Documentation

* fix broken links in docs site ([#2497](https://github.com/libp2p/js-libp2p/issues/2497)) ([fd1f834](https://github.com/libp2p/js-libp2p/commit/fd1f8343db030d74cd08bca6a0cffda93532765f)), closes [#2423](https://github.com/libp2p/js-libp2p/issues/2423)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.2.0 to ^1.3.0

## [4.0.6](https://github.com/libp2p/js-libp2p/compare/crypto-v4.0.5...crypto-v4.0.6) (2024-04-12)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.6 to ^1.2.0

## [4.0.5](https://github.com/libp2p/js-libp2p/compare/crypto-v4.0.4...crypto-v4.0.5) (2024-04-05)


### Bug Fixes

* add @libp2p/record module to monorepo ([#2466](https://github.com/libp2p/js-libp2p/issues/2466)) ([3ffecc5](https://github.com/libp2p/js-libp2p/commit/3ffecc5bfe806a678c1b0228ff830f1811630718))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.5 to ^1.1.6

## [4.0.4](https://github.com/libp2p/js-libp2p/compare/crypto-v4.0.3...crypto-v4.0.4) (2024-03-28)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.4 to ^1.1.5

## [4.0.3](https://github.com/libp2p/js-libp2p/compare/crypto-v4.0.2...crypto-v4.0.3) (2024-02-27)


### Documentation

* add doc-check to all modules ([#2419](https://github.com/libp2p/js-libp2p/issues/2419)) ([6cdb243](https://github.com/libp2p/js-libp2p/commit/6cdb24362de9991e749f76b16fcd4c130e8106a0))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.3 to ^1.1.4

## [4.0.2](https://github.com/libp2p/js-libp2p/compare/crypto-v4.0.1...crypto-v4.0.2) (2024-02-07)


### Bug Fixes

* update patch versions of deps ([#2397](https://github.com/libp2p/js-libp2p/issues/2397)) ([0321812](https://github.com/libp2p/js-libp2p/commit/0321812e731515558f35ae2d53242035a343a21a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.2 to ^1.1.3

## [4.0.1](https://github.com/libp2p/js-libp2p/compare/crypto-v4.0.0...crypto-v4.0.1) (2024-01-16)


### Bug Fixes

* mark all packages side-effect free ([#2360](https://github.com/libp2p/js-libp2p/issues/2360)) ([3c96210](https://github.com/libp2p/js-libp2p/commit/3c96210cf6343b21199996918bae3a0f60220046))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.1 to ^1.1.2

## [4.0.0](https://github.com/libp2p/js-libp2p/compare/crypto-v3.0.4...crypto-v4.0.0) (2024-01-12)


### ⚠ BREAKING CHANGES

* Legacy RSA operations are now in @libp2p/rsa, streaming AES-CTR ciphers are in @libp2p/aes-ctr

### Bug Fixes

* remove node-forge dependency from @libp2p/crypto ([#2355](https://github.com/libp2p/js-libp2p/issues/2355)) ([856ccd7](https://github.com/libp2p/js-libp2p/commit/856ccd7082a42ad0c33486e9b6885452aa886c64))

## [3.0.4](https://github.com/libp2p/js-libp2p/compare/crypto-v3.0.3...crypto-v3.0.4) (2024-01-06)


### Bug Fixes

* remove extra deps ([#2340](https://github.com/libp2p/js-libp2p/issues/2340)) ([53e83ee](https://github.com/libp2p/js-libp2p/commit/53e83eea50410391ec9cff4cd8097210b93894ff))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.1.0 to ^1.1.1

## [3.0.1](https://github.com/libp2p/js-libp2p/compare/crypto-v3.0.0...crypto-v3.0.1) (2023-11-30)


### Bug Fixes

* restore lost commits ([#2268](https://github.com/libp2p/js-libp2p/issues/2268)) ([5775f1d](https://github.com/libp2p/js-libp2p/commit/5775f1df4f5561500e622dc0788fdacbc74e2755))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^1.0.0 to ^1.0.1

## [3.0.0](https://www.github.com/libp2p/js-libp2p/compare/crypto-v2.0.8...crypto-v3.0.0) (2023-11-28)


### ⚠ BREAKING CHANGES

* remove unnecessary async from crypto methods (#1963)

### Features

* support streaming hashes for key sign/verify ([#2255](https://www.github.com/libp2p/js-libp2p/issues/2255)) ([ac7bc38](https://www.github.com/libp2p/js-libp2p/commit/ac7bc3839ae3d8253e9141c52be2c7c0c66a1d60))


### Bug Fixes

* allow keys to do sync sign/verify ([#2258](https://www.github.com/libp2p/js-libp2p/issues/2258)) ([dd7d17c](https://www.github.com/libp2p/js-libp2p/commit/dd7d17cc478dfcba02211a47789439b7d7ab9627))


### Code Refactoring

* remove unnecessary async from crypto methods ([#1963](https://www.github.com/libp2p/js-libp2p/issues/1963)) ([e2267d4](https://www.github.com/libp2p/js-libp2p/commit/e2267d437eeda3d964c77874ec757768d838981a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.6 to ^1.0.0

### [2.0.8](https://www.github.com/libp2p/js-libp2p/compare/crypto-v2.0.7...crypto-v2.0.8) (2023-11-07)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.5 to ^0.1.6

### [2.0.7](https://www.github.com/libp2p/js-libp2p/compare/crypto-v2.0.6...crypto-v2.0.7) (2023-11-03)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.4 to ^0.1.5

### [2.0.6](https://www.github.com/libp2p/js-libp2p/compare/crypto-v2.0.5...crypto-v2.0.6) (2023-10-25)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.3 to ^0.1.4

### [2.0.5](https://www.github.com/libp2p/js-libp2p/compare/crypto-v2.0.4...crypto-v2.0.5) (2023-10-06)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.2 to ^0.1.3

### [2.0.4](https://www.github.com/libp2p/js-libp2p/compare/crypto-v2.0.3...crypto-v2.0.4) (2023-09-15)


### Bug Fixes

* **@libp2p/crypto:** improve unsupported key type message ([#2051](https://www.github.com/libp2p/js-libp2p/issues/2051)) ([d9159dd](https://www.github.com/libp2p/js-libp2p/commit/d9159dd5985241160f791acda164bb2e6408dd90))

### [2.0.3](https://www.github.com/libp2p/js-libp2p/compare/crypto-v2.0.2...crypto-v2.0.3) (2023-08-14)


### Bug Fixes

* update project config ([9c0353c](https://www.github.com/libp2p/js-libp2p/commit/9c0353cf5a1e13196ca0e7764f87e36478518f69))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.1 to ^0.1.2

### [2.0.2](https://www.github.com/libp2p/js-libp2p/compare/crypto-v2.0.1...crypto-v2.0.2) (2023-08-05)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @libp2p/interface bumped from ^0.1.0 to ^0.1.1

### [2.0.1](https://www.github.com/libp2p/js-libp2p/compare/crypto-v2.0.0...crypto-v2.0.1) (2023-08-04)


### Bug Fixes

* **crypto:** limit RSA key size to <= 8192 bits ([#1931](https://www.github.com/libp2p/js-libp2p/issues/1931)) ([58421e1](https://www.github.com/libp2p/js-libp2p/commit/58421e112e7217b36dea27e995f5cfe804387187))

## [2.0.0](https://www.github.com/libp2p/js-libp2p/compare/crypto-v1.0.17...crypto-v2.0.0) (2023-07-31)


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

## [1.0.16](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.15...v1.0.16) (2023-05-05)


### Bug Fixes

* Remove unreliable webkit-linux useragent check ([#319](https://github.com/libp2p/js-libp2p-crypto/issues/319)) ([8f8df5c](https://github.com/libp2p/js-libp2p-crypto/commit/8f8df5ccb99cf49f8d7f85a4834c505738c3bf63)), closes [#318](https://github.com/libp2p/js-libp2p-crypto/issues/318)

## [1.0.15](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.14...v1.0.15) (2023-04-04)


### Bug Fixes

* deriveKey in webkit linux (workaround) ([#313](https://github.com/libp2p/js-libp2p-crypto/issues/313)) ([4905944](https://github.com/libp2p/js-libp2p-crypto/commit/4905944fdb0578a77a36fd5c097be459a501ad34))

## [1.0.14](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.13...v1.0.14) (2023-03-10)


### Dependencies

* bump protons-runtime from 4.0.2 to 5.0.0 ([#297](https://github.com/libp2p/js-libp2p-crypto/issues/297)) ([7e61930](https://github.com/libp2p/js-libp2p-crypto/commit/7e61930f0416bac16dfd66f825a60a49acfbf780))

## [1.0.13](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.12...v1.0.13) (2023-03-10)


### Trivial Changes

* Update .github/workflows/semantic-pull-request.yml [skip ci] ([b66007c](https://github.com/libp2p/js-libp2p-crypto/commit/b66007c8a092789490789dce596b4e157fa855e1))
* Update .github/workflows/semantic-pull-request.yml [skip ci] ([110063c](https://github.com/libp2p/js-libp2p-crypto/commit/110063cbea5d868923a2df2b9676e13a127b81f5))
* Update .github/workflows/semantic-pull-request.yml [skip ci] ([c789b0c](https://github.com/libp2p/js-libp2p-crypto/commit/c789b0c9f18f76df84a4038e9ed893a516babb43))


### Dependencies

* **dev:** upgrade aegir to `38.1.2` ([#302](https://github.com/libp2p/js-libp2p-crypto/issues/302)) ([9d60e39](https://github.com/libp2p/js-libp2p-crypto/commit/9d60e394d5e52167e9197067d3fa7953b30a990b))

## [1.0.12](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.11...v1.0.12) (2023-02-08)


### Bug Fixes

* derive ed25519 public key from private key using node crypto ([#300](https://github.com/libp2p/js-libp2p-crypto/issues/300)) ([874f820](https://github.com/libp2p/js-libp2p-crypto/commit/874f8201c157a76a5fd9d3828c1f44358bce2f48)), closes [#295](https://github.com/libp2p/js-libp2p-crypto/issues/295)


### Trivial Changes

* replace err-code with CodeError ([#293](https://github.com/libp2p/js-libp2p-crypto/issues/293)) ([4398cf6](https://github.com/libp2p/js-libp2p-crypto/commit/4398cf6c719fc7cb051cb3071cad9fc86b858752)), closes [js-libp2p#1269](https://github.com/libp2p/js-libp2p/issues/1269)

## [1.0.11](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.10...v1.0.11) (2023-01-06)


### Dependencies

* bump multiformats from 10.0.3 to 11.0.0 ([#292](https://github.com/libp2p/js-libp2p-crypto/issues/292)) ([f2d78f8](https://github.com/libp2p/js-libp2p-crypto/commit/f2d78f8012b459da0a62bb4a7c63c396f56d4976)), closes [#234](https://github.com/libp2p/js-libp2p-crypto/issues/234) [#226](https://github.com/libp2p/js-libp2p-crypto/issues/226) [#234](https://github.com/libp2p/js-libp2p-crypto/issues/234) [#226](https://github.com/libp2p/js-libp2p-crypto/issues/226) [#226](https://github.com/libp2p/js-libp2p-crypto/issues/226)


### Trivial Changes

* update bundlesize ([c2a1954](https://github.com/libp2p/js-libp2p-crypto/commit/c2a195431ba94fdeedfeb89e406b80a60f960dd7))

## [1.0.10](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.9...v1.0.10) (2022-12-16)


### Documentation

* publish api docs ([#291](https://github.com/libp2p/js-libp2p-crypto/issues/291)) ([5ae970f](https://github.com/libp2p/js-libp2p-crypto/commit/5ae970f0190853470a24509c3e396cc949294d8e))

## [1.0.9](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.8...v1.0.9) (2022-12-01)


### Bug Fixes

* use node crypto for ed25519 signing and verification ([#289](https://github.com/libp2p/js-libp2p-crypto/issues/289)) ([1c623e7](https://github.com/libp2p/js-libp2p-crypto/commit/1c623e7d55ddfafbad0b65b261f55bbc6957df28))

## [1.0.8](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.7...v1.0.8) (2022-12-01)


### Dependencies

* **dev:** bump sinon from 14.0.2 to 15.0.0 ([#287](https://github.com/libp2p/js-libp2p-crypto/issues/287)) ([3aa22cd](https://github.com/libp2p/js-libp2p-crypto/commit/3aa22cdfdef028b3b451e62f9f5784000b2b0690))

## [1.0.7](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.6...v1.0.7) (2022-10-14)


### Dependencies

* update protons-runtime and protons ([#283](https://github.com/libp2p/js-libp2p-crypto/issues/283)) ([2c4650c](https://github.com/libp2p/js-libp2p-crypto/commit/2c4650cff5222344b2573be6db4f791415dc276c))

## [1.0.6](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.5...v1.0.6) (2022-10-13)


### Dependencies

* bump uint8arrays from 3.1.1 to 4.0.2 ([#281](https://github.com/libp2p/js-libp2p-crypto/issues/281)) ([2e87325](https://github.com/libp2p/js-libp2p-crypto/commit/2e8732549814bead1f0da1f2afc5b591f1dfc765))

## [1.0.5](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.4...v1.0.5) (2022-10-13)


### Trivial Changes

* Update .github/workflows/stale.yml [skip ci] ([05c2246](https://github.com/libp2p/js-libp2p-crypto/commit/05c22463b3334ef9dd2c74a29a5f2a5fca96222a))


### Dependencies

* bump multiformats from 9.9.0 to 10.0.0 ([#279](https://github.com/libp2p/js-libp2p-crypto/issues/279)) ([699c812](https://github.com/libp2p/js-libp2p-crypto/commit/699c812e07e35cf81b199698ea362d507777fbd9))
* **dev:** bump @types/mocha from 9.1.1 to 10.0.0 ([#276](https://github.com/libp2p/js-libp2p-crypto/issues/276)) ([bb22d31](https://github.com/libp2p/js-libp2p-crypto/commit/bb22d314c1c1ea6d1e4d4d0bfcbd76969e1f3ab1))

## [1.0.4](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.3...v1.0.4) (2022-08-26)


### Dependencies

* **dev:** bump wherearewe from 1.0.2 to 2.0.1 ([#273](https://github.com/libp2p/js-libp2p-crypto/issues/273)) ([612e8ae](https://github.com/libp2p/js-libp2p-crypto/commit/612e8aef341d1f3392eed047fdc66d9c329cbf1f))

## [1.0.3](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.2...v1.0.3) (2022-08-11)


### Dependencies

* update protons to 5.1.0 ([#272](https://github.com/libp2p/js-libp2p-crypto/issues/272)) ([23a031a](https://github.com/libp2p/js-libp2p-crypto/commit/23a031ab554677ee0b7c5d632e5457edf5615954))

## [1.0.2](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.1...v1.0.2) (2022-08-03)


### Bug Fixes

* remove iso-random-stream dependency ([#262](https://github.com/libp2p/js-libp2p-crypto/issues/262)) ([c5cb096](https://github.com/libp2p/js-libp2p-crypto/commit/c5cb0969a614fb9cab73a5e12acc5e9e8ce9993d))

## [1.0.1](https://github.com/libp2p/js-libp2p-crypto/compare/v1.0.0...v1.0.1) (2022-07-31)


### Trivial Changes

* update project config ([#265](https://github.com/libp2p/js-libp2p-crypto/issues/265)) ([10ca181](https://github.com/libp2p/js-libp2p-crypto/commit/10ca18126bacf97e34283cc82c4bc8500716a4e3))


### Dependencies

* update protons to support no-copy ops ([#268](https://github.com/libp2p/js-libp2p-crypto/issues/268)) ([920b081](https://github.com/libp2p/js-libp2p-crypto/commit/920b081bb88afe094cbedd84a2113cf29ef9f1e8))

## [1.0.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.14...v1.0.0) (2022-06-15)


### ⚠ BREAKING CHANGES

* uses new single-issue libp2p interface modules

### Features

* update to latest libp2p interfaces ([#260](https://github.com/libp2p/js-libp2p-crypto/issues/260)) ([60e0789](https://github.com/libp2p/js-libp2p-crypto/commit/60e078968de7d03a61fde6cfd4ab5a3e378c127f))

### [0.22.14](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.13...v0.22.14) (2022-05-23)


### Bug Fixes

* Added .js extension to import in src/keys/jwk2pem.ts ([#257](https://github.com/libp2p/js-libp2p-crypto/issues/257)) ([9e8f376](https://github.com/libp2p/js-libp2p-crypto/commit/9e8f3767f5f051edc09ae7be77c833817fed7279)), closes [#256](https://github.com/libp2p/js-libp2p-crypto/issues/256)


### Trivial Changes

* **deps:** bump @libp2p/interfaces from 1.3.32 to 2.0.1 ([#258](https://github.com/libp2p/js-libp2p-crypto/issues/258)) ([f7d30bc](https://github.com/libp2p/js-libp2p-crypto/commit/f7d30bce64a74711e56b962412989164530a45d3))

### [0.22.13](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.12...v0.22.13) (2022-05-10)


### Trivial Changes

* **deps-dev:** bump sinon from 13.0.2 to 14.0.0 ([#253](https://github.com/libp2p/js-libp2p-crypto/issues/253)) ([f999025](https://github.com/libp2p/js-libp2p-crypto/commit/f999025ef6f9a2a5ad86e60a6ff95cc4bcef9f06))

### [0.22.12](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.11...v0.22.12) (2022-05-10)


### Bug Fixes

* encode protobuf enums correctly ([#254](https://github.com/libp2p/js-libp2p-crypto/issues/254)) ([a27dc64](https://github.com/libp2p/js-libp2p-crypto/commit/a27dc64a902d947d58fd87ed7c532a66f81eaedd))

### [0.22.11](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.10...v0.22.11) (2022-04-14)


### Bug Fixes

* add return types to key methods ([#252](https://github.com/libp2p/js-libp2p-crypto/issues/252)) ([8363d28](https://github.com/libp2p/js-libp2p-crypto/commit/8363d28eda3a827ff03a6fc29df263b8c474cfb9))

### [0.22.10](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.9...v0.22.10) (2022-04-11)


### Bug Fixes

* use protons ([#251](https://github.com/libp2p/js-libp2p-crypto/issues/251)) ([54a1424](https://github.com/libp2p/js-libp2p-crypto/commit/54a14249ca5e3b7395c243a762fbe6bb4c96e24f))

### [0.22.9](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.8...v0.22.9) (2022-03-10)


### Bug Fixes

* fix broken return type ([#247](https://github.com/libp2p/js-libp2p-crypto/issues/247)) ([afa5b6d](https://github.com/libp2p/js-libp2p-crypto/commit/afa5b6d5a4a5e34e4fcac07803439f32555cb748))

### [0.22.8](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.7...v0.22.8) (2022-02-21)


### Bug Fixes

* bump noble-ed25519 to an audited version ([#245](https://github.com/libp2p/js-libp2p-crypto/issues/245)) ([a104a4f](https://github.com/libp2p/js-libp2p-crypto/commit/a104a4f0a0fa5b2ecefd8928c3963dfa1019355b))

### [0.22.7](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.6...v0.22.7) (2022-02-03)


### Trivial Changes

* **deps-dev:** bump sinon from 12.0.1 to 13.0.1 ([#243](https://github.com/libp2p/js-libp2p-crypto/issues/243)) ([a484751](https://github.com/libp2p/js-libp2p-crypto/commit/a484751847ca6ed1889602b378a1436a84483973))

### [0.22.6](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.5...v0.22.6) (2022-01-17)


### Trivial Changes

* update benchmark deps ([#238](https://github.com/libp2p/js-libp2p-crypto/issues/238)) ([21ffe04](https://github.com/libp2p/js-libp2p-crypto/commit/21ffe0428fa040088f1b91f4e454418f436ed690))

### [0.22.5](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.4...v0.22.5) (2022-01-15)


### Trivial Changes

* update project config ([#237](https://github.com/libp2p/js-libp2p-crypto/issues/237)) ([0f28984](https://github.com/libp2p/js-libp2p-crypto/commit/0f28984dee75d446d03911e271d242f1dbc2e8f9))

### [0.22.4](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.3...v0.22.4) (2022-01-08)


### Trivial Changes

* change min node support to 16 ([#230](https://github.com/libp2p/js-libp2p-crypto/issues/230)) ([9aabfe6](https://github.com/libp2p/js-libp2p-crypto/commit/9aabfe6c885b132366c2772e834f8396c96081e9)), closes [#221](https://github.com/libp2p/js-libp2p-crypto/issues/221)
* **deps:** bump node-forge from 0.10.0 to 1.1.0 ([#231](https://github.com/libp2p/js-libp2p-crypto/issues/231)) ([d33eea1](https://github.com/libp2p/js-libp2p-crypto/commit/d33eea1137c538668f1a54b3bc493e5fb4d1c035))

### [0.22.3](https://github.com/libp2p/js-libp2p-crypto/compare/v0.22.2...v0.22.3) (2022-01-08)


### Trivial Changes

* add semantic release config ([#232](https://github.com/libp2p/js-libp2p-crypto/issues/232)) ([d1b9961](https://github.com/libp2p/js-libp2p-crypto/commit/d1b99617da775ffed7a7e1a20de740338c0c6159))
* uncomment renderer build ([#226](https://github.com/libp2p/js-libp2p-crypto/issues/226)) ([cecad66](https://github.com/libp2p/js-libp2p-crypto/commit/cecad669aa7dda5e5eed178099ae0191a500e543))
* update build ([#227](https://github.com/libp2p/js-libp2p-crypto/issues/227)) ([1642c1b](https://github.com/libp2p/js-libp2p-crypto/commit/1642c1b4386a6d28ed945ffb96ce68ef8a2aed35))
* update build ([#229](https://github.com/libp2p/js-libp2p-crypto/issues/229)) ([3544d9c](https://github.com/libp2p/js-libp2p-crypto/commit/3544d9c63a7fba0b39e7cbf23bc44b4e196ad52b))

# [0.22.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.21.0...v0.22.0) (2022-01-04)


### Features

* convert to typescript ([#222](https://github.com/libp2p/js-libp2p-crypto/issues/222)) ([7875906](https://github.com/libp2p/js-libp2p-crypto/commit/7875906c71fa9fe695889d57061937dd6494b15a))



# [0.21.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.20.0...v0.21.0) (2021-12-01)


### Features

* replace keypair and ursa-optional with node crypto ([#219](https://github.com/libp2p/js-libp2p-crypto/issues/219)) ([759535c](https://github.com/libp2p/js-libp2p-crypto/commit/759535cef65f0141c540524b77c72783288cc0a0))


### BREAKING CHANGES

* requires node 15+



# [0.20.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.19.7...v0.20.0) (2021-10-21)


### Bug Fixes

* demand up to date keypair ([#201](https://github.com/libp2p/js-libp2p-crypto/issues/201)) ([2e40aea](https://github.com/libp2p/js-libp2p-crypto/commit/2e40aeaaa6735a4f2bea58f568d937b60561868b))


### Features

* use noble-secp256k1 and noble-ed25519 ([#202](https://github.com/libp2p/js-libp2p-crypto/issues/202)) ([167eace](https://github.com/libp2p/js-libp2p-crypto/commit/167eaceb61a779904ff006602ce58d7065d126b7))


### BREAKING CHANGES

* keys function hashAndVerify returns boolean false when fail, instead of throwing error



## [0.19.7](https://github.com/libp2p/js-libp2p-crypto/compare/v0.19.6...v0.19.7) (2021-08-18)



## [0.19.6](https://github.com/libp2p/js-libp2p-crypto/compare/v0.19.5...v0.19.6) (2021-07-15)



## [0.19.5](https://github.com/libp2p/js-libp2p-crypto/compare/v0.19.4...v0.19.5) (2021-07-07)



## [0.19.4](https://github.com/libp2p/js-libp2p-crypto/compare/v0.19.3...v0.19.4) (2021-04-20)


### Bug Fixes

* specify pbjs root ([#188](https://github.com/libp2p/js-libp2p-crypto/issues/188)) ([a3da59b](https://github.com/libp2p/js-libp2p-crypto/commit/a3da59b90e50d514d1578236e1c86f05c8cb0805))



## [0.19.3](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.7...v0.19.3) (2021-04-11)


### Bug Fixes

* ed25519 key ID generation ([bc33769](https://github.com/libp2p/js-libp2p-crypto/commit/bc337698b6124e3461c8dc4be2f264ea98351c70))
* ed25519 PeerID generation ([#186](https://github.com/libp2p/js-libp2p-crypto/issues/186)) ([1c16dd3](https://github.com/libp2p/js-libp2p-crypto/commit/1c16dd3dec8a641f55187bd9fbb6c03ba5fafdaa)), closes [ipfs/js-ipfs#3591](https://github.com/ipfs/js-ipfs/issues/3591) [libp2p/js-libp2p-crypto#185](https://github.com/libp2p/js-libp2p-crypto/issues/185)
* go ed25519 interop ([2f18a07](https://github.com/libp2p/js-libp2p-crypto/commit/2f18a077b47ee84c450431f7431ecdfc913c8543))
* remove rendundant public key ([#181](https://github.com/libp2p/js-libp2p-crypto/issues/181)) ([afcffc8](https://github.com/libp2p/js-libp2p-crypto/commit/afcffc8115c8833edfe2a942d05547f418be5585))
* replace node buffers with uint8arrays ([#180](https://github.com/libp2p/js-libp2p-crypto/issues/180)) ([a0f387a](https://github.com/libp2p/js-libp2p-crypto/commit/a0f387aeab5dff45368341d0d80a5d1a25e9f849))


### Features

* add exporting/importing of non rsa keys in libp2p-key format ([#179](https://github.com/libp2p/js-libp2p-crypto/issues/179)) ([7273739](https://github.com/libp2p/js-libp2p-crypto/commit/7273739f045b33a46aae45f5003dd09f7ea6e37e))


### BREAKING CHANGES

* The private ed25519 key will no longer include the redundant public key

* chore: fix lint



<a name="0.19.2"></a>
## [0.19.2](https://github.com/libp2p/js-libp2p-crypto/compare/v0.19.1...v0.19.2) (2021-03-17)


### Bug Fixes

* ed25519 PeerID generation ([#186](https://github.com/libp2p/js-libp2p-crypto/issues/186)) ([1c16dd3](https://github.com/libp2p/js-libp2p-crypto/commit/1c16dd3)), closes [ipfs/js-ipfs#3591](https://github.com/ipfs/js-ipfs/issues/3591) [libp2p/js-libp2p-crypto#185](https://github.com/libp2p/js-libp2p-crypto/issues/185)



<a name="0.19.1"></a>
## [0.19.1](https://github.com/libp2p/js-libp2p-crypto/compare/v0.19.0...v0.19.1) (2021-03-15)


### Bug Fixes

* ed25519 key ID generation ([bc33769](https://github.com/libp2p/js-libp2p-crypto/commit/bc33769))



<a name="0.19.0"></a>
# [0.19.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.18.0...v0.19.0) (2021-01-15)



<a name="0.18.0"></a>
# [0.18.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.9...v0.18.0) (2020-08-07)


### Bug Fixes

* remove rendundant public key ([#181](https://github.com/libp2p/js-libp2p-crypto/issues/181)) ([afcffc8](https://github.com/libp2p/js-libp2p-crypto/commit/afcffc8))
* replace node buffers with uint8arrays ([#180](https://github.com/libp2p/js-libp2p-crypto/issues/180)) ([a0f387a](https://github.com/libp2p/js-libp2p-crypto/commit/a0f387a))


### BREAKING CHANGES

* The private ed25519 key will no longer include the redundant public key

* chore: fix lint
* - Where node Buffers were returned, now Uint8Arrays are

* chore: remove commented code



<a name="0.17.9"></a>
## [0.17.9](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.8...v0.17.9) (2020-08-05)


### Features

* add exporting/importing of non rsa keys in libp2p-key format ([#179](https://github.com/libp2p/js-libp2p-crypto/issues/179)) ([7273739](https://github.com/libp2p/js-libp2p-crypto/commit/7273739))



<a name="0.17.8"></a>
## [0.17.8](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.7...v0.17.8) (2020-07-20)


### Bug Fixes

* go ed25519 interop ([2f18a07](https://github.com/libp2p/js-libp2p-crypto/commit/2f18a07))



<a name="0.17.7"></a>
## [0.17.7](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.6...v0.17.7) (2020-06-09)



<a name="0.17.6"></a>
## [0.17.6](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.5...v0.17.6) (2020-04-07)


### Bug Fixes

* add buffer and update deps ([#25](https://github.com/libp2p/js-libp2p-crypto/issues/25)) ([35f196e](https://github.com/libp2p/js-libp2p-crypto/commit/35f196e))
* **unmarshal:** provide only one arg to callback ([#17](https://github.com/libp2p/js-libp2p-crypto/issues/17)) ([3bb8451](https://github.com/libp2p/js-libp2p-crypto/commit/3bb8451))
* circular circular dep -> DI ([0dcf1a6](https://github.com/libp2p/js-libp2p-crypto/commit/0dcf1a6))
* update deps and repo setup ([cfdcbe0](https://github.com/libp2p/js-libp2p-crypto/commit/cfdcbe0))


### Features

* add `id()` method to Secp256k1PrivateKey ([f4dbd62](https://github.com/libp2p/js-libp2p-crypto/commit/f4dbd62))
* initial implementation ([4c36aeb](https://github.com/libp2p/js-libp2p-crypto/commit/4c36aeb))
* next libp2p-crypto ([#4](https://github.com/libp2p/js-libp2p-crypto/issues/4)) ([4ee48a7](https://github.com/libp2p/js-libp2p-crypto/commit/4ee48a7))
* use async await ([#18](https://github.com/libp2p/js-libp2p-crypto/issues/18)) ([1974eb9](https://github.com/libp2p/js-libp2p-crypto/commit/1974eb9))


### BREAKING CHANGES

* Callback support has been dropped in favor of async/await.

* feat: use async/await

This PR changes this module to remove callbacks and use async/await. The API is unchanged aside from the obvious removal of the `callback` parameter.

refs https://github.com/ipfs/js-ipfs/issues/1670

* fix: use latest multihashing-async as it is all promises now



<a name="0.17.5"></a>
## [0.17.5](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.4...v0.17.5) (2020-03-24)



<a name="0.17.4"></a>
## [0.17.4](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.3...v0.17.4) (2020-03-23)


### Bug Fixes

* add buffer, cleanup, reduce size ([#170](https://github.com/libp2p/js-libp2p-crypto/issues/170)) ([c956d1a](https://github.com/libp2p/js-libp2p-crypto/commit/c956d1a))



<a name="0.17.3"></a>
## [0.17.3](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.2...v0.17.3) (2020-02-26)


### Performance Improvements

* remove asn1.js and use node-forge ([#166](https://github.com/libp2p/js-libp2p-crypto/issues/166)) ([00477e3](https://github.com/libp2p/js-libp2p-crypto/commit/00477e3))
* remove jwk2privPem and jwk2pubPem ([#162](https://github.com/libp2p/js-libp2p-crypto/issues/162)) ([cc20949](https://github.com/libp2p/js-libp2p-crypto/commit/cc20949))


### BREAKING CHANGES

* removes unused jwk2pem methods `jwk2pubPem` and `jwk2privPem`. These methods are not being used in any js libp2p modules, so only users referencing these directly will be impacted.



<a name="0.17.2"></a>
## [0.17.2](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.1...v0.17.2) (2020-01-17)


### Features

* add typescript types + linting/tests ([#161](https://github.com/libp2p/js-libp2p-crypto/issues/161)) ([e01977c](https://github.com/libp2p/js-libp2p-crypto/commit/e01977c))



<a name="0.17.1"></a>
## [0.17.1](https://github.com/libp2p/js-libp2p-crypto/compare/v0.17.0...v0.17.1) (2019-10-25)


### Bug Fixes

* better error for missing web crypto ([a5e0560](https://github.com/libp2p/js-libp2p-crypto/commit/a5e0560))
* browser rsa enc/dec ([b8e2414](https://github.com/libp2p/js-libp2p-crypto/commit/b8e2414))
* jwk var naming ([8b8d0c1](https://github.com/libp2p/js-libp2p-crypto/commit/8b8d0c1))
* lint ([2c294b5](https://github.com/libp2p/js-libp2p-crypto/commit/2c294b5))
* padding error ([2c1bac5](https://github.com/libp2p/js-libp2p-crypto/commit/2c1bac5))
* use direct buffers instead of converting to hex ([027a5a9](https://github.com/libp2p/js-libp2p-crypto/commit/027a5a9))


### Features

* add (rsa)pubKey.encrypt and (rsa)privKey.decrypt ([34c5f5c](https://github.com/libp2p/js-libp2p-crypto/commit/34c5f5c))
* browser enc/dec ([9f747a1](https://github.com/libp2p/js-libp2p-crypto/commit/9f747a1))
* use forge to convert jwk2forge ([b998f63](https://github.com/libp2p/js-libp2p-crypto/commit/b998f63))



<a name="0.17.0"></a>
# [0.17.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.16.1...v0.17.0) (2019-07-11)


### Bug Fixes

* **deps:** update to ursa-optiona@0.10 ([26b6217](https://github.com/libp2p/js-libp2p-crypto/commit/26b6217))
* fix links in README ([#148](https://github.com/libp2p/js-libp2p-crypto/issues/148)) ([5cd0e8c](https://github.com/libp2p/js-libp2p-crypto/commit/5cd0e8c))
* put optional args last for key export ([#154](https://github.com/libp2p/js-libp2p-crypto/issues/154)) ([d675670](https://github.com/libp2p/js-libp2p-crypto/commit/d675670))


### Features

* refactor to use async/await ([#131](https://github.com/libp2p/js-libp2p-crypto/issues/131)) ([ad71072](https://github.com/libp2p/js-libp2p-crypto/commit/ad71072))


### BREAKING CHANGES

* key export arguments are now swapped so that the optional format is last
* API refactored to use async/await

feat: WIP use async await
fix: passing tests
chore: update travis node.js versions
fix: skip ursa optional tests on windows
fix: benchmarks
docs: update docs
fix: remove broken and intested private key decrypt
chore: update deps



<a name="0.16.1"></a>
## [0.16.1](https://github.com/libp2p/js-libp2p-crypto/compare/v0.16.0...v0.16.1) (2019-02-26)



<a name="0.16.0"></a>
# [0.16.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.15.0...v0.16.0) (2019-01-08)


### Bug Fixes

* clean up, bundle size reduction ([8d8294d](https://github.com/libp2p/js-libp2p-crypto/commit/8d8294d))


### BREAKING CHANGES

* getRandomValues method exported from src/keys/rsa-browser.js and src/keys/rsa.js signature has changed from accepting an array to a number for random byte length 



<a name="0.15.0"></a>
# [0.15.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.14.1...v0.15.0) (2019-01-03)


### Features

* nextTick instead of setImmediate, and fix sync in async ([#136](https://github.com/libp2p/js-libp2p-crypto/issues/136)) ([c54ea20](https://github.com/libp2p/js-libp2p-crypto/commit/c54ea20))



<a name="0.14.1"></a>
## [0.14.1](https://github.com/libp2p/js-libp2p-crypto/compare/v0.14.0...v0.14.1) (2018-11-05)


### Bug Fixes

* dont setimmediate when its not needed ([9e57786](https://github.com/libp2p/js-libp2p-crypto/commit/9e57786))



<a name="0.14.0"></a>
# [0.14.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.13.0...v0.14.0) (2018-09-17)


### Bug Fixes

* windows build ([c7e0409](https://github.com/libp2p/js-libp2p-crypto/commit/c7e0409))
* **lint:** use ~ for ursa-optional version ([e8cbf13](https://github.com/libp2p/js-libp2p-crypto/commit/e8cbf13))


### Features

* use ursa-optional for lightning fast key generation ([b05e77f](https://github.com/libp2p/js-libp2p-crypto/commit/b05e77f))



<a name="0.13.0"></a>
# [0.13.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.12.1...v0.13.0) (2018-04-05)



<a name="0.12.1"></a>
## [0.12.1](https://github.com/libp2p/js-libp2p-crypto/compare/v0.12.0...v0.12.1) (2018-02-12)



<a name="0.12.0"></a>
# [0.12.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.11.0...v0.12.0) (2018-01-27)


### Features

* improve perf ([#117](https://github.com/libp2p/js-libp2p-crypto/issues/117)) ([cdcca5f](https://github.com/libp2p/js-libp2p-crypto/commit/cdcca5f))



<a name="0.11.0"></a>
# [0.11.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.10.4...v0.11.0) (2017-12-20)


### Features

* key exchange with jsrsasign ([#115](https://github.com/libp2p/js-libp2p-crypto/issues/115)) ([b342128](https://github.com/libp2p/js-libp2p-crypto/commit/b342128))



<a name="0.10.4"></a>
## [0.10.4](https://github.com/libp2p/js-libp2p-crypto/compare/v0.10.3...v0.10.4) (2017-12-01)


### Bug Fixes

* catch error when unmarshaling instead of crashing ([#113](https://github.com/libp2p/js-libp2p-crypto/issues/113)) ([7608fdd](https://github.com/libp2p/js-libp2p-crypto/commit/7608fdd))



<a name="0.10.3"></a>
## [0.10.3](https://github.com/libp2p/js-libp2p-crypto/compare/v0.10.2...v0.10.3) (2017-09-07)


### Features

* switch protocol-buffers to protons ([#110](https://github.com/libp2p/js-libp2p-crypto/issues/110)) ([3a91ae2](https://github.com/libp2p/js-libp2p-crypto/commit/3a91ae2))



<a name="0.10.2"></a>
## [0.10.2](https://github.com/libp2p/js-libp2p-crypto/compare/v0.10.1...v0.10.2) (2017-09-06)


### Bug Fixes

* use regular protocol-buffers until protobufjs is fixed ([#109](https://github.com/libp2p/js-libp2p-crypto/issues/109)) ([957fdd3](https://github.com/libp2p/js-libp2p-crypto/commit/957fdd3))


### Features

* **deps:** upgrade to aegir@12 and browserify-aes@1.0.8 ([83257bc](https://github.com/libp2p/js-libp2p-crypto/commit/83257bc))



<a name="0.10.1"></a>
## [0.10.1](https://github.com/libp2p/js-libp2p-crypto/compare/v0.10.0...v0.10.1) (2017-09-05)


### Bug Fixes

* switch to protobufjs ([#107](https://github.com/libp2p/js-libp2p-crypto/issues/107)) ([dc2793f](https://github.com/libp2p/js-libp2p-crypto/commit/dc2793f))



<a name="0.10.0"></a>
# [0.10.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.9.4...v0.10.0) (2017-09-03)


### Features

* p2p addrs situation ([#106](https://github.com/libp2p/js-libp2p-crypto/issues/106)) ([9e977c7](https://github.com/libp2p/js-libp2p-crypto/commit/9e977c7))
* skip nextTick in nodeify ([#103](https://github.com/libp2p/js-libp2p-crypto/issues/103)) ([f20267b](https://github.com/libp2p/js-libp2p-crypto/commit/f20267b))



<a name="0.9.4"></a>
## [0.9.4](https://github.com/libp2p/js-libp2p-crypto/compare/v0.9.3...v0.9.4) (2017-07-22)


### Bug Fixes

* circular circular dep -> DI ([bc554d1](https://github.com/libp2p/js-libp2p-crypto/commit/bc554d1))



<a name="0.9.3"></a>
## [0.9.3](https://github.com/libp2p/js-libp2p-crypto/compare/v0.9.2...v0.9.3) (2017-07-22)



<a name="0.9.2"></a>
## [0.9.2](https://github.com/libp2p/js-libp2p-crypto/compare/v0.9.1...v0.9.2) (2017-07-22)



<a name="0.9.1"></a>
## [0.9.1](https://github.com/libp2p/js-libp2p-crypto/compare/v0.9.0...v0.9.1) (2017-07-22)



<a name="0.9.0"></a>
# [0.9.0](https://github.com/libp2p/js-libp2p-crypto/compare/v0.8.8...v0.9.0) (2017-07-22)



<a name="0.8.8"></a>
## [0.8.8](https://github.com/libp2p/js-libp2p-crypto/compare/v0.8.7...v0.8.8) (2017-04-11)


### Bug Fixes

* **ecdh:** allow base64 to be left-0-padded, needed for JWK format  ([be64372](https://github.com/libp2p/js-libp2p-crypto/commit/be64372)), closes [#97](https://github.com/libp2p/js-libp2p-crypto/issues/97)



<a name="0.8.7"></a>
## [0.8.7](https://github.com/libp2p/js-libp2p-crypto/compare/v0.8.6...v0.8.7) (2017-03-21)



<a name="0.8.6"></a>
## [0.8.6](https://github.com/libp2p/js-libp2p-crypto/compare/v0.8.5...v0.8.6) (2017-03-03)


### Bug Fixes

* **package:** update tweetnacl to version 1.0.0-rc.1 ([4e56e17](https://github.com/libp2p/js-libp2p-crypto/commit/4e56e17))


### Features

* **keys:** implement generateKeyPairFromSeed for ed25519  ([e5b7c1f](https://github.com/libp2p/js-libp2p-crypto/commit/e5b7c1f))
