import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import { localState } from 'alchemy/State/LocalState';
import * as Effect from 'effect/Effect';

// A single Cloudflare.StaticSite under `alchemy dev` on a FRESH state store.
//
// In dev, StaticSite passes its dev-server URL output to the Worker as `dev`:
//   Worker("Worker", { dev: dev.url, … })   // dev.url is Output<string | false>
//
// The Worker's local-dev provider then builds its config as:
//   dev: { ...props.dev, port: props.dev?.port ?? 1337 }
//
// i.e. it expects `props.dev` to be a `{ port: number }` config — but it's the
// URL output. So `props.dev?.port` resolves to `Dev.url.map(…).url.port`, an
// unresolved Output, which gets JS-coerced to a number at `Worker.precreate`:
//
//   Cannot coerce Output<…url.port> to a number via JS coercion.
//
// Only happens on FRESH state (the create/precreate path). State is the local
// file backend, so no Cloudflare account is required — the crash is in the
// local dev layer, before any Cloudflare API call.
export default Alchemy.Stack(
  'Mre',
  {
    providers: Cloudflare.providers(),
    state: localState(),
  },
  Effect.gen(function* () {
    const site = yield* Cloudflare.StaticSite('Site', {
      command: 'mkdir -p dist',
      outdir: 'dist',
      dev: { command: 'bun ./dev-server.mjs --port 5001' },
    });

    return { site: site.url };
  }),
);
