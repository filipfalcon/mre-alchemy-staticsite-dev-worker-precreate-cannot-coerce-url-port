# mre-alchemy-staticsite-dev-worker-precreate-cannot-coerce-url-port

A minimal reproduction example of a bug occurring in Alchemy 2.0.0-beta.57.

A single `Cloudflare.StaticSite` run under `alchemy dev` on a fresh state store
crashes at `Worker.precreate` with a `Cannot coerce Output<…url.port> to a
number` error. No Cloudflare account is required (state uses the local file
backend).

## Steps to reproduce

1. `bun install`
2. `bun run dev` (runs `alchemy dev`) on a **fresh** state store (no `.alchemy/`)
3. Observe the apply fail: the `Worker` resource reports `✗` and the error below
   is printed.

It only fires on the create/`precreate` path, so it must run against fresh
state. To re-run cleanly: `rm -rf .alchemy && bun run dev`.

## Expected behavior

`alchemy dev` starts the dev server and the `StaticSite`'s `Worker` is created,
surfacing the dev URL.

## Actual behavior

The apply fails at `Worker.precreate`:

```
Error: Cannot coerce Output<Dev.url.map((url) => ({
    url: url ?? props.dev?.url ?? !1
  })).url.port> to a number via JS coercion. Use Output.interpolate`...` or Output.map(output, fn) to compose Outputs — the value isn't known until deploy time.
    at provider.precreate (.../alchemy/src/Apply.ts)
```

### Root cause

`StaticSite` and the Worker's local-dev provider disagree on the shape of `dev`:

- `StaticSite` passes its dev-server **URL output** as the Worker's `dev`
  (`src/Cloudflare/Website/StaticSite.ts` — `Worker("Worker", { dev: dev.url })`,
  where `dev = Output.map(d.url, (url) => ({ url: url ?? props.dev?.url ?? false }))`).
- The Worker's local-dev provider treats `dev` as a `{ port }` **config**
  (`src/Cloudflare/Workers/LocalWorkerProvider.ts` — `dev: { ...props.dev, port: props.dev?.port ?? 1337 }`).

So `props.dev?.port` resolves to `Dev.url.map(…).url.port` — an unresolved
`Output` — which is then JS-coerced to a number to bind the local proxy port,
which `Output` forbids. Warm state takes the update path and never builds this,
so it only crashes on fresh state.

The bug persists (non-fatally — it recovers instead of crashing the apply) in
later preview builds such as `2f5400e`.

## Environment

- alchemy: 2.0.0-beta.57
- effect: 4.0.0-beta.85
- @effect/platform-bun / @effect/platform-node: 4.0.0-beta.85
- Bun: 1.3.13
- OS: macOS (Darwin 25.5.0)

## License

Since this repository contains a minimal reproduction example of a bug
occurring in an open-source technology, this code is hereby released into the
public domain to serve the greater good of improving open-source tooling. See
[LICENSE](LICENSE) for the full terms.
