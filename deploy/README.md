# Frontend deployment

The frontend workflow builds `dist/` with the production API URL, copies it to
`/var/www/dialysis/releases/<release-id>`, and atomically switches the `current`
symlink. The host Nginx serves `/var/www/dialysis/current` directly. The API and
SignalR continue to proxy to `127.0.0.1:8081`.

Before the first frontend push, run the updated backend
`deploy/server-bootstrap.sh` on the server to create `/var/www/dialysis/releases`
with the deploy user's ownership. Create a `production` GitHub Environment in
this repository with `APP_DOMAIN` set to the bare HTTPS domain, such as
`dialysis.example.com`. Set these Actions secrets in the frontend repository:

```text
PRODUCTION_SSH_HOST
PRODUCTION_SSH_USER
PRODUCTION_SSH_PRIVATE_KEY
PRODUCTION_SSH_KNOWN_HOSTS
```

Use the same SSH destination and key as the backend deployment. The production
API URL is built as `https://APP_DOMAIN/api/v1`; it is public build configuration,
not a secret. No Docker, Compose, or GHCR access is required for frontend deploy.

For an existing server, publish a frontend release before reloading the updated
host Nginx configuration from the backend repository. After the Nginx cutover
and a successful browser check, the old `web` container can be stopped.
