# Package the exact dist-web artifact validated by build:web and browser checks.
# Build with --platform linux/amd64 for the production server.
FROM caddy:2@sha256:5e5286cb37d44086d651a5363f05f43a692ce4d649d88fb1bd844579f45fa9e8
ARG VCS_REF
LABEL org.opencontainers.image.source="https://github.com/jammyfu/MagMark" \
      org.opencontainers.image.revision="${VCS_REF}"
COPY deploy/container/Caddyfile /etc/caddy/Caddyfile
COPY dist-web/ /srv/
ENV XDG_CONFIG_HOME=/tmp/config XDG_DATA_HOME=/tmp/data
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
