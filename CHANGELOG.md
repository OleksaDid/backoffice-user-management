# Changelog

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
