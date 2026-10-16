# Contributing

## Code style

Biome defines code style in `biome.jsonc`, and CI enforces it.
Run `yarn lint:fix` to apply formatting, organize imports, and apply safe lint fixes.
Run `yarn lint:ts` to check the result. Some lint errors require manual changes.

## Development

Run `yarn build` to compile the library and tests, `yarn test` to run the test suite,
and `yarn lint:md` to check Markdown. The integration tests require `MBUSER` and
`MBPWD` credentials and access to MusicBrainz.

PR descriptions should state which issue is resolved. Leave test validation details to CI.
