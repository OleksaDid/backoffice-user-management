# Changelog

## [1.0.3](https://github.com/OleksaDid/backoffice-user-management/compare/v1.0.2...v1.0.3) (2026-11-28)


### Bug Fixes

* answer the session probe with nulls instead of 401 ([#35](https://github.com/OleksaDid/backoffice-user-management/issues/35)) ([5aa111b](https://github.com/OleksaDid/backoffice-user-management/commit/5aa111b74c65462b36b226f3fdd8d2d129311203))
* **api:** answer the session probe with nulls instead of 401 ([ca9741e](https://github.com/OleksaDid/backoffice-user-management/commit/ca9741edea1af3b7a0c419f02a7da3c6c721ee3b))
* **web:** read the signed-out state from the session probe body ([7428704](https://github.com/OleksaDid/backoffice-user-management/commit/7428704ad692f0c88357ed1e1eb78a973dd32416))
* **web:** stop zod from probing for eval under the CSP ([6430a2b](https://github.com/OleksaDid/backoffice-user-management/commit/6430a2b3d2fa83342749c5e9b8618530d68581e3))


### Documentation

* record why the session probe answers nulls ([d5ccd2e](https://github.com/OleksaDid/backoffice-user-management/commit/d5ccd2ea3152e5b60a2509bbf012f6e518daa94f))


### Tests

* **e2e:** check that a first visit logs no console errors ([c343abd](https://github.com/OleksaDid/backoffice-user-management/commit/c343abd6304f2a60371378d81d642d09825e8f2d))

## [1.0.2](https://github.com/OleksaDid/backoffice-user-management/compare/v1.0.1...v1.0.2) (2026-11-28)


### Bug Fixes

* address the full review (session id exposure, a11y, delivery checks) ([#33](https://github.com/OleksaDid/backoffice-user-management/issues/33)) ([fc7f801](https://github.com/OleksaDid/backoffice-user-management/commit/fc7f801f5a0a5c6d721aeffda3550d7fdbafd087))
* **api:** give oversized bodies, wrong media types and an unreachable database their own errors ([ac6b674](https://github.com/OleksaDid/backoffice-user-management/commit/ac6b674e40ec53b98bd5aeac30c2da71e5743f62))
* **api:** stop returning the session id from /auth/me ([b414424](https://github.com/OleksaDid/backoffice-user-management/commit/b414424ff3af8474497361ee51b05861cd345c79))
* **api:** tighten authentication order, cookie config and session termination ([a164817](https://github.com/OleksaDid/backoffice-user-management/commit/a16481737e3d85adb7c078de4314785fcc42a12c))
* **docker:** do not cache 404s for missing assets for a year ([1653649](https://github.com/OleksaDid/backoffice-user-management/commit/1653649882961585439f710d19f11ee7d787c34d))
* **web:** keep the own Delete button focusable so its explanation is reachable ([077c86d](https://github.com/OleksaDid/backoffice-user-management/commit/077c86d015d9f0a12014767416864ed5a4f8c020))
* **web:** leave initial focus alone and keep the header on one line ([89b6669](https://github.com/OleksaDid/backoffice-user-management/commit/89b6669a0577d384d3115f0e5a8947b4522e3112))
* **web:** never lose status-change notifications; give the switch a stable name ([7a594df](https://github.com/OleksaDid/backoffice-user-management/commit/7a594df041ab8510ee246bd740ff7bde3aad358e))


### Documentation

* correct the local e2e command and state the remaining limitations ([e9f3fc9](https://github.com/OleksaDid/backoffice-user-management/commit/e9f3fc9e9c0a49754c31ba8780f73c1a570bd0b5))


### Build and Deployment

* verify the deployed revision and fail without the release token ([08f8dd1](https://github.com/OleksaDid/backoffice-user-management/commit/08f8dd194ee4b94bdbe5816bea691555a67fb24f))


### Tests

* **api:** give the real-process lifecycle test more startup headroom ([a5e7622](https://github.com/OleksaDid/backoffice-user-management/commit/a5e7622547b1c268d7e998b2f4f3a4e4dec0453c))
* **web:** update dashboard tests and make the theme script test path-independent ([85406c8](https://github.com/OleksaDid/backoffice-user-management/commit/85406c8085e9a04f59830b83c3e22745fc1e38bf))

## [1.0.1](https://github.com/OleksaDid/backoffice-user-management/compare/v1.0.0...v1.0.1) (2026-11-27)


### Tests

* **e2e:** match pagination buttons by exact name ([c136cca](https://github.com/OleksaDid/backoffice-user-management/commit/c136ccacb35b431b207cdbb92c2abcb1e3950f0d))
* **e2e:** match pagination buttons by exact name ([#31](https://github.com/OleksaDid/backoffice-user-management/issues/31)) ([3068d5c](https://github.com/OleksaDid/backoffice-user-management/commit/3068d5c82e3aa1dbff3da6c3edfc8cc917b5dbd1))

## [1.0.0](https://github.com/OleksaDid/backoffice-user-management/compare/v0.5.0...v1.0.0) (2026-11-27)


### Bug Fixes

* address the Part 4 review findings ([0c87bbc](https://github.com/OleksaDid/backoffice-user-management/commit/0c87bbc499618f0f7241e2ed055e1d7d020842ce))
* **api:** give container-starting integration tests enough time ([42648ec](https://github.com/OleksaDid/backoffice-user-management/commit/42648ecf9ea62f8f1311db8349b6af4f1db1809d))
* **docker:** send Cache-Control and HSTS once on API responses ([1b96dd1](https://github.com/OleksaDid/backoffice-user-management/commit/1b96dd1657f5aa1502f4313e38a88913d0112515))
* e2e findings from staging (loading-state ARIA, log out race, dialog animation) ([#30](https://github.com/OleksaDid/backoffice-user-management/issues/30)) ([e629ede](https://github.com/OleksaDid/backoffice-user-management/commit/e629ede130acc0f43de0759d044ca3fc32c55d32))
* **web:** label loading states with text instead of aria-label ([caca68a](https://github.com/OleksaDid/backoffice-user-management/commit/caca68aa39a63763f1f094b55c4a324109640481))


### Documentation

* final README, e2e on staging and release 1.0.0 ([#28](https://github.com/OleksaDid/backoffice-user-management/issues/28)) ([a64978c](https://github.com/OleksaDid/backoffice-user-management/commit/a64978cfd6d1834b4bb146f4eae9afe14b3ea5d7))
* generate a traceability matrix from test titles ([e05be51](https://github.com/OleksaDid/backoffice-user-management/commit/e05be512824e264c31797d6ed42faad5127946c1))
* record the testing strategy decision ([c1d861f](https://github.com/OleksaDid/backoffice-user-management/commit/c1d861fbad901dd2f5ecc27cd1d36363e88b7694))
* update agent guidance and the deployment guide for the final pipeline ([26d1edb](https://github.com/OleksaDid/backoffice-user-management/commit/26d1edba838e2eafb34e475293466a15eeca5fe8))
* write the final README ([813d5f2](https://github.com/OleksaDid/backoffice-user-management/commit/813d5f26f28bde09be6f0705f391c1be9f1b2fe0))


### Build and Deployment

* enforce coverage thresholds, traceability and non-root containers ([85d6300](https://github.com/OleksaDid/backoffice-user-management/commit/85d630086be03c2125e1dba0b17c476a023054ee))
* run the full end-to-end suite on staging before releasing ([cada7d6](https://github.com/OleksaDid/backoffice-user-management/commit/cada7d6ce4452d783b8b821ff20c79d480a65f03))


### Tests

* close requirement gaps and reference requirements in test titles ([907cbc6](https://github.com/OleksaDid/backoffice-user-management/commit/907cbc68b827ff1800f1406d6277e61bab3e51e0))
* **e2e:** run in Chromium, Firefox and WebKit and check production headers ([440669a](https://github.com/OleksaDid/backoffice-user-management/commit/440669a809f1ac2585a9a01f5eba8c5e0e347296))
* **e2e:** run with reduced motion so axe never sees a fading dialog ([a4db934](https://github.com/OleksaDid/backoffice-user-management/commit/a4db934116613971f1ddfe123bd029c679ec5ce1))
* **e2e:** wait for sign-out to finish before the next step ([9f95080](https://github.com/OleksaDid/backoffice-user-management/commit/9f9508086e662ad542531ab8d01915ad2cc88487))
* enforce coverage, trace every requirement and run e2e in three browsers (Part 4) ([#27](https://github.com/OleksaDid/backoffice-user-management/issues/27)) ([070b65a](https://github.com/OleksaDid/backoffice-user-management/commit/070b65a6a7728d32863aa650c897c2b38d8e18d6))


### Miscellaneous

* **release:** mark the complete challenge as 1.0.0 ([4bddd14](https://github.com/OleksaDid/backoffice-user-management/commit/4bddd14d8dc32008e9306b4b0e094e32d78f2c44))

## [0.5.0](https://github.com/OleksaDid/backoffice-user-management/compare/v0.4.0...v0.5.0) (2026-11-27)


### Features

* **web:** add light, dark and system themes (Part 3) ([#25](https://github.com/OleksaDid/backoffice-user-management/issues/25)) ([fec5cf4](https://github.com/OleksaDid/backoffice-user-management/commit/fec5cf47b676cb86fde699092f77ab4e67f38060))


### Bug Fixes

* **web:** render page errors inside the layout ([76633e9](https://github.com/OleksaDid/backoffice-user-management/commit/76633e9266d933111d6fe577c98dc8efb668bb2c))


### Tests

* make the theme tests prove what they claim ([36a9acb](https://github.com/OleksaDid/backoffice-user-management/commit/36a9acb61ac870568f2285dd1a81a947c2fe9ab5))


### Refactoring

* **web:** share the brand palette between the theme and CSS variables ([9c4a7c6](https://github.com/OleksaDid/backoffice-user-management/commit/9c4a7c6a9eb05c5d12df841bbbe0407a02ab329b))

## [0.4.0](https://github.com/OleksaDid/backoffice-user-management/compare/v0.3.0...v0.4.0) (2026-11-27)


### Features

* **contracts:** add the create-user form schema ([87bcffc](https://github.com/OleksaDid/backoffice-user-management/commit/87bcffc6254afc1f24258598d260cfb7e71d8aa9))
* **web:** add the user management dashboard (Part 2) ([92056e7](https://github.com/OleksaDid/backoffice-user-management/commit/92056e742f9dac9c425a0620894e1c1a4eab7315))
* **web:** add the user management dashboard (Part 2) ([#22](https://github.com/OleksaDid/backoffice-user-management/issues/22)) ([508f925](https://github.com/OleksaDid/backoffice-user-management/commit/508f925b6fa97fbb83545bc654e2dea27975c9fc))
* **web:** add the users API client, queries and notifications ([4f1b0fe](https://github.com/OleksaDid/backoffice-user-management/commit/4f1b0fe9d3e57edd7826c604469f7d716c7a948c))
* **web:** show the pointer cursor on interactive controls ([23da09f](https://github.com/OleksaDid/backoffice-user-management/commit/23da09f80bac77a3fdb09a7aca919bffb99f8159))


### Bug Fixes

* **web:** address the dashboard review findings ([4148ec7](https://github.com/OleksaDid/backoffice-user-management/commit/4148ec7ac2078f03516626213ac71863f29ba33b))
* **web:** give the dialog close button an accessible name ([551ffeb](https://github.com/OleksaDid/backoffice-user-management/commit/551ffeb2b6662a42b9a193b6bec3c47dbf1bbaf2))
* **web:** warn when a background refresh of the users list fails ([2a1b2e1](https://github.com/OleksaDid/backoffice-user-management/commit/2a1b2e1089ca0bd54c6c0c76fd4838e2fa2b1b97))


### Documentation

* note the dashboard in the README ([aeb8d52](https://github.com/OleksaDid/backoffice-user-management/commit/aeb8d5224987c998132a24dc63c1c036196b4251))


### Tests

* cover review fixes and restore the stale-list warning ([#24](https://github.com/OleksaDid/backoffice-user-management/issues/24)) ([2fb0e0d](https://github.com/OleksaDid/backoffice-user-management/commit/2fb0e0dbebf685a8969a736cf4a4fb5714344294))
* cover the review fixes that had no tests ([773c698](https://github.com/OleksaDid/backoffice-user-management/commit/773c6983e57915a5d4b192dae35ffa935f0f7735))
* **e2e:** add dashboard journeys with accessibility checks ([cd62849](https://github.com/OleksaDid/backoffice-user-management/commit/cd628499ecb736bf945ba98fcb5dd4e912efdd8f))
* **web:** cover the dashboard against an in-memory users API ([cc61bd3](https://github.com/OleksaDid/backoffice-user-management/commit/cc61bd3602092edc9201572252f6a23c9eb73b98))

## [0.3.0](https://github.com/OleksaDid/backoffice-user-management/compare/v0.2.0...v0.3.0) (2026-11-27)


### Features

* **api:** add authentication with cookie sessions (Part 1, backend) ([#17](https://github.com/OleksaDid/backoffice-user-management/issues/17)) ([c37df99](https://github.com/OleksaDid/backoffice-user-management/commit/c37df99cf8f3a1ed319dfda3ea5c30af0e685fdf))
* **db:** give demo users emails and a documented password ([56b13b1](https://github.com/OleksaDid/backoffice-user-management/commit/56b13b18deeb5b0c3bcd0c32885086c755ea4af5))
* **web:** add sign-up, sign-in and welcome pages (Part 1, web) ([#19](https://github.com/OleksaDid/backoffice-user-management/issues/19)) ([28ed049](https://github.com/OleksaDid/backoffice-user-management/commit/28ed049f4bbb89ff0b18d46c5d4f010ef4ab4632))
* **web:** add sign-up, sign-in, welcome and log out (Part 1) ([8712914](https://github.com/OleksaDid/backoffice-user-management/commit/8712914d28294a69ef8b4b131c7a7a20334313bd))
* **web:** add the API client and frontend error handling ([0bafd09](https://github.com/OleksaDid/backoffice-user-management/commit/0bafd09b3418067d394d50179d3ffddfeb93035b))


### Bug Fixes

* **web:** derive error codes from the status for non-problem responses ([3df0231](https://github.com/OleksaDid/backoffice-user-management/commit/3df02317174c8b118204b6b89df72eca2f187f91))
* **web:** end sessions in one place and report boundary errors once ([d92b364](https://github.com/OleksaDid/backoffice-user-management/commit/d92b3641a2dcdf39fa0c08b54cba9a521d823671))
* **web:** meet AA contrast for secondary text and links in text ([213ffe3](https://github.com/OleksaDid/backoffice-user-management/commit/213ffe3b2ed1dd41239db7d943ba3823fce881d8))


### Performance

* **api:** authenticate requests with one query ([e90faee](https://github.com/OleksaDid/backoffice-user-management/commit/e90faee082a56a106e98ddc8a9837b850c59fbd3))
* **api:** authenticate with one query and keep sign-in failures at 401 ([#21](https://github.com/OleksaDid/backoffice-user-management/issues/21)) ([954ef29](https://github.com/OleksaDid/backoffice-user-management/commit/954ef2944cfa233932a633eb24da8b8fb5eaa3cb))


### Documentation

* document authentication endpoints and demo sign-in ([6d255dd](https://github.com/OleksaDid/backoffice-user-management/commit/6d255dd0a7994db7b40bfccaee3ef7c9fd3a32e9))


### Build and Deployment

* run the end-to-end suite against the production images ([8b26fd7](https://github.com/OleksaDid/backoffice-user-management/commit/8b26fd7b27aaa3e6eab41e5377fb8d24317b2a91))


### Tests

* **api:** cover the sign-in race and inactive-user sessions ([5ef7a81](https://github.com/OleksaDid/backoffice-user-management/commit/5ef7a818a0ee9df67b67fa204e8e503e08d7b115))
* **e2e:** add Playwright journeys for authentication with axe checks ([7377165](https://github.com/OleksaDid/backoffice-user-management/commit/7377165e368860c4428ca864a1ac9773aa2a6237))
* **web:** cover the sign-up loading state and single submission ([36f8fcf](https://github.com/OleksaDid/backoffice-user-management/commit/36f8fcfc554688ba7072795e040c360ee25176e4))
* **web:** cover the sign-up, sign-in and session flows ([b27961c](https://github.com/OleksaDid/backoffice-user-management/commit/b27961c9adc7df6d602e25c1c6e4b6a90faa1189))


### Refactoring

* **web:** fix password field accessibility once in a wrapper ([44ede6e](https://github.com/OleksaDid/backoffice-user-management/commit/44ede6ebb194ac5244dbd566d4883dfeff17fc03))

## [0.2.0](https://github.com/OleksaDid/backoffice-user-management/compare/v0.1.0...v0.2.0) (2026-11-27)


### Features

* **api:** add domain rules for user updates and sessions ([20adbde](https://github.com/OleksaDid/backoffice-user-management/commit/20adbde3f005779feb58e4789818a3549c9b1e92))
* **api:** add user and session repositories with a unit of work ([ebb7267](https://github.com/OleksaDid/backoffice-user-management/commit/ebb7267fc9b78789d08e18591b37664188ff8443))
* **api:** add user and session services ([b8228a7](https://github.com/OleksaDid/backoffice-user-management/commit/b8228a72968d7d48b515822db454fabb1de9dd02))
* **api:** add users and sessions API (Part 0) ([#13](https://github.com/OleksaDid/backoffice-user-management/issues/13)) ([4a5b406](https://github.com/OleksaDid/backoffice-user-management/commit/4a5b406f3eabf54bc5cbc046b58d43ec7003d5ab))
* **api:** expose the users and sessions endpoints ([38194a8](https://github.com/OleksaDid/backoffice-user-management/commit/38194a8d30ab2fa67d815e98bb8a22f42437b063))
* **api:** require both names when updating a user's profile ([68de1bb](https://github.com/OleksaDid/backoffice-user-management/commit/68de1bb3c938b1ab2e6727c99a37193e7871b290))
* **contracts:** add user, session and pagination schemas ([d594b74](https://github.com/OleksaDid/backoffice-user-management/commit/d594b74e06196c861f186465b4a95c77c2a80b83))
* **db:** add the demo data reset command ([78349c4](https://github.com/OleksaDid/backoffice-user-management/commit/78349c42f1206d29f9b0a22fc46a20cc6c818f13))


### Documentation

* document the users and sessions API and shift release numbers ([5422440](https://github.com/OleksaDid/backoffice-user-management/commit/54224405247fb8a0925246df1bd1fb76117fd078))


### Tests

* **api:** cover the sessions API against PostgreSQL ([26628ac](https://github.com/OleksaDid/backoffice-user-management/commit/26628ac6cd0e961673ac4b518588756dca1d5c13))
* **api:** cover the users API against PostgreSQL ([79e47bd](https://github.com/OleksaDid/backoffice-user-management/commit/79e47bd912a27d83e46b9a7bdaacb6a45829f346))
* **api:** scaffold users and sessions API tests from the spec ([57f8567](https://github.com/OleksaDid/backoffice-user-management/commit/57f8567dac77e07b3526c81c47f95a69519eeee0))

## 0.1.0 (2026-11-27)


### Features

* **api:** add API foundation with error handling, health, database and Docker ([#3](https://github.com/OleksaDid/backoffice-user-management/issues/3)) ([b584786](https://github.com/OleksaDid/backoffice-user-management/commit/b584786044eca3219f4a9b362b1f52f625e54254))
* **api:** add structured logging and a replaceable ErrorReporter ([eebd308](https://github.com/OleksaDid/backoffice-user-management/commit/eebd3089da4b7de10d203e16e3ccee541e82ffcf))
* **api:** add the AppError base class for expected failures ([c0b6b76](https://github.com/OleksaDid/backoffice-user-management/commit/c0b6b76caaede0893590f34a36e783d1ba0983da))
* **api:** add the server entry point with graceful shutdown ([788252c](https://github.com/OleksaDid/backoffice-user-management/commit/788252c984ad667c486b862b7268e845ad314170))
* **api:** build the HTTP app with health checks and OpenAPI docs ([87cefcd](https://github.com/OleksaDid/backoffice-user-management/commit/87cefcd0e66dffd2d94d11ca2d535a0271c76525))
* **api:** convert every error to problem details in one handler ([f9fe1a3](https://github.com/OleksaDid/backoffice-user-management/commit/f9fe1a30fb5759ff0a55fe76e1de7ee7f5361fbe))
* **api:** scaffold the API workspace with validated configuration ([078f585](https://github.com/OleksaDid/backoffice-user-management/commit/078f585f68c7798fcc3a186566b416d8bffa56ee))
* **contracts:** add the shared error catalog and problem details schema ([147b030](https://github.com/OleksaDid/backoffice-user-management/commit/147b030518e7d404902c87c01958dd9ebd5e08c7))
* **db:** add the Part 0 schema and its initial migration ([77f2b39](https://github.com/OleksaDid/backoffice-user-management/commit/77f2b39ff9068677b7b64165348779face9010f8))
* **db:** run migrations as a one-off step and probe readiness ([7b4adcf](https://github.com/OleksaDid/backoffice-user-management/commit/7b4adcf127c35c1350ac8f6303b364d7c3a79990))
* **web:** add SPA shell and nginx image with same-origin API proxy ([#4](https://github.com/OleksaDid/backoffice-user-management/issues/4)) ([5a279de](https://github.com/OleksaDid/backoffice-user-management/commit/5a279de8486e04cba737696f6512e26b431689b4))
* **web:** scaffold the React app shell with Mantine design tokens ([2446d9a](https://github.com/OleksaDid/backoffice-user-management/commit/2446d9a997de12f7bc6dcb0e707f7761021ad3d3))


### Bug Fixes

* **release:** start at 0.1.0 and keep release PRs within the conventions ([806f104](https://github.com/OleksaDid/backoffice-user-management/commit/806f1046bb3029fc1dc5df70488fe0efd62cd516))
* **release:** start at 0.1.0 and keep release PRs within the conventions ([#12](https://github.com/OleksaDid/backoffice-user-management/issues/12)) ([f49377d](https://github.com/OleksaDid/backoffice-user-management/commit/f49377de340988162bf98294efa42d3a2a186f29))


### Documentation

* add AGENTS.md and CLAUDE.md for AI coding agents ([c42c766](https://github.com/OleksaDid/backoffice-user-management/commit/c42c766eb227d8ea39052695f5e26619ddce8816))
* add behaviour specification and acceptance criteria ([#2](https://github.com/OleksaDid/backoffice-user-management/issues/2)) ([0af8f0e](https://github.com/OleksaDid/backoffice-user-management/commit/0af8f0e68ac431d2a05e3041545a5e70764de7ce))
* add specification conventions and glossary ([1d96d51](https://github.com/OleksaDid/backoffice-user-management/commit/1d96d514745522439436b1b18a454577fe646bd5))
* align migration names in the spec with drizzle-kit numbering ([5ba81a1](https://github.com/OleksaDid/backoffice-user-management/commit/5ba81a1824ff7cabfe723ccb338dc64e290f0a2a))
* clarify that loginsCount counts sign-ins, not active sessions ([a4622b9](https://github.com/OleksaDid/backoffice-user-management/commit/a4622b9fb2a3dd973fa3d9b389780f6f4dfaf818))
* describe the branching, review and release workflow ([962f4da](https://github.com/OleksaDid/backoffice-user-management/commit/962f4da08324eca92a3405bac7f907207813ac3e))
* **docker:** add the server Compose template and deployment guide ([1f66bd1](https://github.com/OleksaDid/backoffice-user-management/commit/1f66bd16f6e4500f05f543000df95993b3027942))
* document how to run, develop and migrate the API ([03f0855](https://github.com/OleksaDid/backoffice-user-management/commit/03f0855d7a62e03f008299740259c885dd491bc0))
* link the live environments and the deployment guide ([8a6fb42](https://github.com/OleksaDid/backoffice-user-management/commit/8a6fb42707ce22e85d36b0eb5bc417764b36f785))
* link the specification from the README ([d0452bc](https://github.com/OleksaDid/backoffice-user-management/commit/d0452bcae411e1d789ef3d25dd448a5628e1b64f))
* map the challenge acceptance criteria to spec IDs ([cd85996](https://github.com/OleksaDid/backoffice-user-management/commit/cd85996373ec04060c914aec8cc5066a054fc66f))
* outline the README ([f2ad553](https://github.com/OleksaDid/backoffice-user-management/commit/f2ad553a1d9399a555fc77b5fab729ec1af596c3))
* record credential storage and session cookie decisions ([b9c9d0b](https://github.com/OleksaDid/backoffice-user-management/commit/b9c9d0b077654299fc797cdaa33a26feac575c38))
* record interpretations of open requirements ([d4def66](https://github.com/OleksaDid/backoffice-user-management/commit/d4def66e146ac5ebe29c8ed9cc1161c532a6bba1))
* specify authentication and the sign-up/sign-in pages ([08bea2f](https://github.com/OleksaDid/backoffice-user-management/commit/08bea2f1677736f477c032c60424ca66bb32d358))
* specify concurrent sessions across devices ([e5a0310](https://github.com/OleksaDid/backoffice-user-management/commit/e5a0310f0adf3be125a56190894a43f39a3f76d7))
* specify non-functional requirements ([5e6bc2f](https://github.com/OleksaDid/backoffice-user-management/commit/5e6bc2f31029db443fb60b0b8d0f642480d44e97))
* specify the data model and migration plan ([a1f285b](https://github.com/OleksaDid/backoffice-user-management/commit/a1f285bfa361ba0551f23d11fa9395b00a4829ea))
* specify the error model and catalog ([44d3b61](https://github.com/OleksaDid/backoffice-user-management/commit/44d3b6110ea55e0199497c7c82134502aa3d6c3d))
* specify the user management dashboard ([4ac810c](https://github.com/OleksaDid/backoffice-user-management/commit/4ac810c7afc78b044bfad2403c87b12974fa5dee))
* specify the users and sessions API ([76d0e79](https://github.com/OleksaDid/backoffice-user-management/commit/76d0e799ac4004022ded24572ebe11be8ee64b90))
* specify theme selection and persistence ([7b3314e](https://github.com/OleksaDid/backoffice-user-management/commit/7b3314eb5dca77deb162c78640a1363afe6c15fb))
* start the decision log with stack and workflow ADRs ([75725e4](https://github.com/OleksaDid/backoffice-user-management/commit/75725e4c9e48ac7f6ec25b6dd2eb4a41f3d49fe9))


### Build and Deployment

* add a reusable deployment workflow ([de061e0](https://github.com/OleksaDid/backoffice-user-management/commit/de061e04bf07532787c1ae847c59fbbcdd35a3b0))
* add continuous delivery to staging and production ([#5](https://github.com/OleksaDid/backoffice-user-management/issues/5)) ([b6128d0](https://github.com/OleksaDid/backoffice-user-management/commit/b6128d0d3e4f23fca47f39be0c6485b425eb2331))
* add pull request quality pipeline ([9f927d2](https://github.com/OleksaDid/backoffice-user-management/commit/9f927d2ff21da589151c6204296b001ddd8a043b))
* build the API Docker image on every pull request ([dab5e6f](https://github.com/OleksaDid/backoffice-user-management/commit/dab5e6f1eaec66b5fac1c652906cf2a1508e3f55))
* **docker:** add a multi-stage production image for the API ([ca50858](https://github.com/OleksaDid/backoffice-user-management/commit/ca50858a1b5c72a37d3a203586509e397ad55f73))
* **docker:** add the web server to Compose and smoke-test the stack in CI ([4b56554](https://github.com/OleksaDid/backoffice-user-management/commit/4b5655465698a77bce895d07c28c04e3472f2ab7))
* **docker:** run database, migrations and API with Docker Compose ([858e5b9](https://github.com/OleksaDid/backoffice-user-management/commit/858e5b9cb877e1421ee7cc3e7a2464b87a0132c7))
* **docker:** serve the SPA with unprivileged nginx and proxy the API ([f5610a3](https://github.com/OleksaDid/backoffice-user-management/commit/f5610a3109da29d3976524730d0b0f4648d4a1e6))
* promote released images and deploy them to production ([092e5e8](https://github.com/OleksaDid/backoffice-user-management/commit/092e5e8b9f712866ef1e0045fc8e964414f7b39d))
* publish images and deploy every main commit to staging ([b93f371](https://github.com/OleksaDid/backoffice-user-management/commit/b93f371f7b24a27deb22682f20d2b14a1d420c0e))
* run checks on stacked pull requests too ([2209f32](https://github.com/OleksaDid/backoffice-user-management/commit/2209f32fefd50d3264bec2a5b3c4e6601bea8778))
