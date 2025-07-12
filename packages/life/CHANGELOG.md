# life

## 0.6.0

### Minor Changes

- [@LilaRest](https://github.com/LilaRest) in [8a45f00](https://github.com/lifejs/lifejs/commit/8a45f00893d9c67ad4f89707e0bc061881a0cadb) — Fully functional memories plugin
- [@LilaRest](https://github.com/LilaRest) in [68f67dc](https://github.com/lifejs/lifejs/commit/68f67dc6c2bbab1ca85f490ac65e7d3ff2fed269) — Wire plugins interceptors to the event loop of the external dependency
- [@LilaRest](https://github.com/LilaRest) in [89fc2d1](https://github.com/lifejs/lifejs/commit/89fc2d14ebd925bf7957135630a53f0bcc7645ba) — New life/define export
- [@LilaRest](https://github.com/LilaRest) in [113c9fc](https://github.com/lifejs/lifejs/commit/113c9fce224c062bbbdcb4c90879a3a72a4b426d) — Huge refactoring/refinement of plugins' dependencies and methods + draft memories plugin

### Patch Changes

- [@LilaRest](https://github.com/LilaRest) in [ab75a12](https://github.com/lifejs/lifejs/commit/ab75a12c81a0fc55751cadac990f4200e487757f) — Fix plugin methods in agent definition not assigning plugin methods after called

## 0.5.1

### Patch Changes

- [@LilaRest](https://github.com/LilaRest) in [ed9ef4e](https://github.com/lifejs/lifejs/commit/ed9ef4e2a1a71bb39a54a6bc6d49467f42a220bd) — Fix tools calls formatting in Mistral LLM provider class
- [@LilaRest](https://github.com/LilaRest) in [ed9ef4e](https://github.com/lifejs/lifejs/commit/ed9ef4e2a1a71bb39a54a6bc6d49467f42a220bd) — A lot of simplification on the orchestration/generation classes of the core plugin
- [@LilaRest](https://github.com/LilaRest) in [0bfdca7](https://github.com/lifejs/lifejs/commit/0bfdca7744d31fbba780e67708504639bdad47d4) — Fix new Int16Array type error
- [@LilaRest](https://github.com/LilaRest) in [ed9ef4e](https://github.com/lifejs/lifejs/commit/ed9ef4e2a1a71bb39a54a6bc6d49467f42a220bd) — Mistral LLM provider class wasn't emitting end token

## 0.5.0

### Minor Changes

- [@Cheelax](https://github.com/Cheelax) **(New contributor! 🎉)**, [@LilaRest](https://github.com/LilaRest) in [#65](https://github.com/lifejs/lifejs/pull/65) — Support Mistral.ai LLM provider
- [@LilaRest](https://github.com/LilaRest) in [1c22c1c](https://github.com/lifejs/lifejs/commit/1c22c1ce90c48f765938f78675be01715c1651db) — Add all models and available languages to Cartesia TTS config schema

### Patch Changes

- [@LilaRest](https://github.com/LilaRest) in [a44c42d](https://github.com/lifejs/lifejs/commit/a44c42da884d662f004eabc146d906683c6e5731) — Generation interruptions weren't working in the case the generation had ended, but it's produced content was still being played. This commit fixes that.
- [@LilaRest](https://github.com/LilaRest) in [4d397bd](https://github.com/lifejs/lifejs/commit/4d397bdec16b38a5fb47be8a9f8b15a30cea4508) — Disable output stream throttling in text-only mode

## 0.4.0

### Minor Changes

- [@LilaRest](https://github.com/LilaRest) in [1e6a64a](https://github.com/lifejs/lifejs/commit/1e6a64a0781c3738231e4719504a2758dc5e9ab1) — Re-introduce proper buffer flushing in the Livekit provider
- [@LilaRest](https://github.com/LilaRest) in [90e523c](https://github.com/lifejs/lifejs/commit/90e523c74bbafa595056008994c99e1300fc4656) — Make voice output optional and configurable during conversation

### Patch Changes

- [@LilaRest](https://github.com/LilaRest) in [4b2dc70](https://github.com/lifejs/lifejs/commit/4b2dc70ff627617a842744697f88303260f3b365) — Replace history message IDs by prefixed short IDs
- [@LilaRest](https://github.com/LilaRest) in [90e523c](https://github.com/lifejs/lifejs/commit/90e523c74bbafa595056008994c99e1300fc4656) — Prevent further history writing after interruption
- [@LilaRest](https://github.com/LilaRest) in [e938b3d](https://github.com/lifejs/lifejs/commit/e938b3d02fe75527e7d2344a3fe99deed78bd75f) — Avoid agent.interrupted event being sent when a generation hasn't sent any output token yet
- [@LilaRest](https://github.com/LilaRest) in [90e523c](https://github.com/lifejs/lifejs/commit/90e523c74bbafa595056008994c99e1300fc4656) — Tools were blocked by TTS pipeline when no content chunk was emitted
- [@LilaRest](https://github.com/LilaRest) in [2ca40eb](https://github.com/lifejs/lifejs/commit/2ca40ebcebbe5883ba02a0844ded5d394486318f) — Fix pace contamination in base TTS class sometimes leading to doublons or missing parts in transcripts

## 0.3.0

### Minor Changes

- [@LilaRest](https://github.com/LilaRest) in [eab7741](https://github.com/lifejs/lifejs/commit/eab77416a4784e788f2812aba2a0d61b69448dd2) — The 'core' plugin is now fully functional, and way simpler.

### Patch Changes

- [@LilaRest](https://github.com/LilaRest) in [4910db1](https://github.com/lifejs/lifejs/commit/4910db1e15f8ddd9e49c00f0df9939b873e7f77e) — Give a default value to TTS pace weighed average, so if the conversation begins before the TTS calibration generation, the text chunks estimations are still almost accurate.
- [@LilaRest](https://github.com/LilaRest) in [0c50ed4](https://github.com/lifejs/lifejs/commit/0c50ed4121d777090522bc6b0f7ccb6914d13f52) — Solve TTS provider output 'end' token with a 1-3 delay + simplify Cartesia provider
- [@LilaRest](https://github.com/LilaRest) in [d654387](https://github.com/lifejs/lifejs/commit/d6543871f074109de3fa5866b5acc3c3a6f9515c) — Interruption handling in generation orchestrator wasn't properly forwarding author key

## 0.2.0

### Minor Changes

- [@DavidIfebueme](https://github.com/DavidIfebueme) **(New contributor! 🎉)**, [@LilaRest](https://github.com/LilaRest) in [#55](https://github.com/lifejs/lifejs/pull/55) — Add support for X.ai LLM provider

### Patch Changes

- [@LilaRest](https://github.com/LilaRest) in [2129f4a](https://github.com/lifejs/lifejs/commit/2129f4ae9803292d848ef98141b53f817da0c603) — add min/max temparature to OpenAI provider's config schema

## 0.1.1

### Patch Changes

- [@LilaRest](https://github.com/LilaRest) **(New contributor! 🎉)** in [48932e0](https://github.com/lifejs/lifejs/commit/48932e00719b653b5901f6ac9528871eec95cecd) — A dummy change to test changelog formatting

## 0.1.0

### Minor Changes

- [@LilaRest](https://github.com/LilaRest) in [d9f876a](https://github.com/lifejs/lifejs/commit/d9f876ade9bab676c5764534d4852089b421195f) — We needed to start somewhere, and we started here 🌱
