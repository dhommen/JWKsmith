# JWKsmith
Tiny sidecar/microservice that exposes `/.well-known/jwks.json` from a mounted PKCS#12 (.p12) certificate.

## Node server

Setup:

1. Copy `.env.example` to `.env` and adjust values.
2. Put your `.p12` in `certs/cert.p12` (or set `P12_PATH` in `.env`).
3. Install deps and start the server.

Endpoints:

- `GET /.well-known/jwks.json` – JWKS with the public certificate.
- `GET /healthz` – Health check.

## Docker

Build the image:

```bash
docker build -t jwksmith:local .
```

Run the container (mount your .p12 and pass env):

```bash
docker run --rm \
	-p 3000:3000 \
	-e P12_PATH=/app/certs/cert.p12 \
	-e P12_PASSWORD=changeit \
	-e KEY_ID=my-key-id \
	-e PORT=3000 \
	-e LOG_LEVEL=info \
	-e PRETTY_LOGS=true \
	-v "$(pwd)/certs:/app/certs:ro" \
	jwksmith:local
```

Notes:
- Runs as non-root user inside the container.
- Healthcheck pings `/healthz`.
- `certs/` is excluded from the image; mount it at runtime.

