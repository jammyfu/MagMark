# Docker websites behind a shared HTTPS gateway

MagMark runs in an independent, read-only, non-root Docker container. A separate Caddy container handles public HTTP/HTTPS for every site. Only the gateway publishes host ports; MagMark listens at `magmark:8080` on the shared Docker network. Both containers have a 128 MB memory limit, suitable for this static website on the 1 GB server.

## Build an application image

Build and test off-server with the repository-pinned Node version:

```sh
MAGMARK_SITE_URL=https://magmark.cn/ npm run build:web
MAGMARK_SITE_URL=https://magmark.cn/ node scripts/check-web-release.cjs
docker build --platform linux/amd64 --build-arg VCS_REF="$(git rev-parse HEAD)" -t magmark-web:RELEASE .
```

The default site URL is https://magmark.cn/. Set MAGMARK_SITE_URL only when intentionally building another deployment identity. The Dockerfile packages the exact verified `dist-web` artifact. `.dockerignore` allows only that artifact and the container Caddy config; source drafts, credentials, server configuration and node_modules cannot enter the image build context. Check the image revision label and release manifest, then transfer using a registry or `docker save` / `docker load` with SHA256 verification. The server does not need Node, npm or a database.

## Server installation

Inspect server identity, listeners, Docker containers and resources. Reuse existing proxies when appropriate; never replace one or stop an unknown service. Record the server gateway's HTTP/HTTPS port ownership before startup. Use the shared workspace registry for local test ports, with no host ports published for internal app containers.

Copy these deployment templates outside the Git checkout to an owner-controlled directory. Keep the real `.env` and release history there, never in Git or build artifacts. Required environment values: `CADDY_IMAGE` (reviewed digest), `MAGMARK_IMAGE` (verified image identity), `EDGE_HTTP_PORT`, `EDGE_HTTPS_PORT`, `MAGMARK_DOMAIN` (`magmark.cn` for this release). DNS must point to the server before automatic public HTTPS can work.

```text
compose.yaml
Caddyfile
sites/
  magmark.caddy
.env                  # owner-local only
releases/             # owner-local image/hash records and rollback identities
```

Validate and launch:

```sh
docker compose config --quiet
docker compose run --rm --no-deps edge caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose up -d magmark edge
```

Keep certificate volumes persistent. Confirm app health, homepage, bilingual guides, robots/sitemap, decoded logo, desktop/mobile editing and cover controls. Match served HTML against the verified artifact. Retain the previous app image and environment backup for rollback; update only MAGMARK_IMAGE to select a new image, then `docker compose up -d magmark`. Do not overwrite existing server secrets, databases or uploads.

## Additional websites

Add a service with its own image and no host ports to `compose.yaml`, connected to `edge`. Add `sites/<site>.caddy` with its explicit hostname and `reverse_proxy <service>:<internal-port>`. Each website has independent containers, image versions and rollback history; only the gateway owns the public ports. Databases remain on private networks without host ports. The `shared-web-edge` network also supports separate project Compose stacks via an external network declaration.

Validate all configs, launch the added service, then reload the gateway:

```sh
docker compose exec -T edge caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose exec -T edge caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

No catch-all hostname routes unknown domains to MagMark. Add www redirects only when their DNS is ready. Reserve resource headroom for future sites rather than running build toolchains on the server.
