# Sealos deployment notes

The repository also includes a GitHub Actions template under `.github/workflows/deploy-sealos.yml`. It deploys an isolated app name and domain; set repository secrets before enabling it.

1. Build the image from the repository root so the Dockerfile can copy `package-lock.json` and source files.
2. Push the image to the registry available to the target Sealos cluster.
3. Deploy as a stateless HTTP service, container port `8080`, with a readiness probe on `/`.
4. Configure domain and HTTPS in Sealos. No runtime secrets are needed by the static MVP.
5. Verify a hard refresh on `/`, `/career-graph.json`, the graph tab, mobile layout, and CSP headers.

Do not commit registry credentials, kubeconfig, Sealos tokens, or private source files.
