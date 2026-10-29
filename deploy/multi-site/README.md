# Shared multi-site gateway

Build the browser application locally or in CI; the 1 GB server serves static files and does not need Node, npm, or a database.

```sh
MAGMARK_SITE_URL=https://magamark.cn/ npm run build:web
```

The default build without this variable keeps the existing Bubufu beta path. `MAGMARK_BASE_PATH`, if explicitly set, must match the URL pathname. Canonical URLs, social images, guides, robots.txt and sitemap use the selected site URL.

## Before installation

Inspect server identity, listeners, Docker containers, existing proxies, disk and memory. Reuse an existing proxy where appropriate; do not replace it or stop unknown services. Reserve the remote gateway's HTTP/HTTPS ports in the owner's service inventory before startup. The shared local workspace registry remains the source for local preview ports. Do not start a local copy of this gateway on unallocated ports.

Copy these templates to an owner-controlled deployment directory, outside the Git checkout. Keep the actual `.env` there, never in Git or an application artifact. Required variables: `CADDY_IMAGE` (reviewed tag/digest), `EDGE_HTTP_PORT`, `EDGE_HTTPS_PORT`, `MAGMARK_DOMAIN`. The public hostname for this release is `magamark.cn`. Confirm public DNS points to the server and the selected ingress ports are accessible before requesting certificates.

Layout (relative to the deployment directory):

```text
compose.yaml
Caddyfile
sites/
  magmark.caddy
www/
  magmark/
    releases/<commit>/   # contents of dist-web, plus release manifest
    current -> releases/<commit>
```

Keep the certificate volumes persistent. Validate before starting/reloading:

```sh
docker compose config --quiet
docker compose run --rm --no-deps edge caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose up -d edge
```

Publish by extracting the verified artifact to a NEW release directory and atomically replacing the relative `current` symlink. Keep the previous target for rollback. Do not copy local environment files, drafts, uploads or node_modules into releases. Verify `/`, `/guide/`, `/guide/en/`, `/robots.txt`, `/sitemap.xml`, logo decoding, editing and cover interactions at desktop/mobile widths; confirm HTTPS and the served HTML hash.

## Add another website

Add `sites/<site>.caddy` with its own hostname and root, plus `www/<site>/releases/<commit>` and its own `current` symlink. For a backend, connect its container to the gateway network and use `reverse_proxy <service>:<internal-port>`; do not publish its database or internal API to the host. Only the shared edge owns public HTTP/HTTPS ports. Validate all site configs, then reload:

```sh
docker compose exec -T edge caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose exec -T edge caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Hostnames are explicit. No catch-all points an unknown domain at MagMark. Configure `www` redirects only after its DNS is ready. Avoid a wildcard certificate or a domain routing to another site by accident.
