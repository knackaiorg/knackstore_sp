# Deploying KnackStore to SAP BTP Cloud Foundry

Single Cloud Foundry app. The Angular bundle is embedded in the Spring Boot JAR
and served by the same app, so the UI and the API share one origin — the
frontend's relative `apiUrl: '/api'` works unchanged and there is no CORS setup.

```
                       https://knackstore-xxxx.cfapps.<region>.hana.ondemand.com
                                          │
                            ┌─────────────▼──────────────┐
                            │  knackstore  (1 instance)  │
                            │  java_buildpack · JRE 17   │
                            ├────────────────────────────┤
   GET /            ───────▶│ classpath:/static/index.html
   GET /main.*.js   ───────▶│ classpath:/static/*        │
   GET /products/5  ───────▶│ index.html (SPA fallback)  │
   GET /api/**      ───────▶│ Spring @RestControllers    │
                            │        └── H2, in-memory   │
                            └────────────────────────────┘
```

---

## 1. Prerequisites

| Requirement | Check / install |
|---|---|
| Cloud Foundry CLI v8 | `brew install cloudfoundry/tap/cf-cli@8` — **not currently installed on this machine** |
| BTP subaccount with Cloud Foundry runtime enabled, and a Space | BTP cockpit → your subaccount → *Cloud Foundry* → *Spaces* |
| ≥ 1 GB free memory in the org (limit is 4,096 MB) | `cf org-quota` / BTP cockpit |
| Node 20 + Java 17 locally (for the build only) | `node -v`, `java -version` |

---

## 2. Build the deployable JAR

```bash
./build-cf.sh
```

This runs the Angular production build, packages the Spring Boot JAR with
`mvn -Pcf package`, and then asserts that `index.html` actually landed inside the
JAR — so a UI-less artifact can't silently reach Cloud Foundry.

Output: `backend/target/electronics-store-api-1.0.0.jar` (the path `manifest.yml`
references).

---

## 3. Log in to Cloud Foundry

Current target (from the BTP cockpit's subaccount overview):

| | |
|---|---|
| API endpoint | `https://api.cf.us21-001.hana.ondemand.com` |
| Org | `Knack systems, LLC_knack-coe-demo-test1` |
| Apps domain | `cfapps.us21-001.hana.ondemand.com` |
| Org memory limit | 4,096 MB (Cloud Foundry Runtime, free plan) |

```bash
cf login -a https://api.cf.us21-001.hana.ondemand.com

# SSO / custom IdP instead:
# cf login -a https://api.cf.us21-001.hana.ondemand.com --sso

cf target      # confirm the org and space are the ones you expect
```

**The route domain in `manifest.yml` must match the landscape.** It mirrors the
API endpoint — `api.cf.us21-001…` means routes live on `cfapps.us21-001…`.
Deploying a manifest whose route names a domain that does not exist in the target
org fails with:

```
No domains exist for route knackstore-....cfapps.<wrong-region>.hana.ondemand.com
```

List what the org actually offers before changing region:

```bash
cf domains
```

In the cockpit the same list is the domain dropdown under *Space* → *Routes* →
*New Route*.

---

## 4. Deploy

The `cloud` profile deliberately has **no fallback** for the JWT signing key, so
the app fails fast rather than signing tokens with the well-known secret
committed in `application.properties`. Either route below sets it before the app
serves traffic.

### Option A — BTP cockpit (uploading the JAR + manifest)

The cockpit deploys **and starts** in one action, so there is no window to set the
variable first. The app therefore crashloops on its very first deploy with
`Could not resolve placeholder 'JWT_SECRET'`. That is expected, not a fault:

1. Upload the JAR and `manifest.yml`; let the first deploy fail.
2. Space → **Applications** → `knackstore` → **User-Provided Variables**.
3. **New Variable** → name `JWT_SECRET`, value a long random string. Generate it
   rather than inventing one by hand:
   ```bash
   openssl rand -base64 48
   ```
4. Save, then **Restart** the app.

The variable persists across redeploys, so this is one-time per app — later JAR
uploads start cleanly. (To avoid the failed first deploy entirely, create the app
with 0 instances, add the variable, then scale to 1. The one-crash route is
simpler and harmless.)

### Option B — cf CLI

```bash
cf push --no-start
cf set-env knackstore JWT_SECRET "$(openssl rand -base64 48)"
cf start knackstore

cf app knackstore        # the `routes:` line is your URL
```

To rotate the secret later, repeat `cf set-env` and `cf restart knackstore`. All
existing tokens are invalidated, so users must log in again.

---

## 5. Verify the deployment

```bash
APP_URL="https://$(cf app knackstore | awk '/^routes:/ {print $2}')"

curl -s -o /dev/null -w 'UI          %{http_code}\n' "$APP_URL/"
curl -s -o /dev/null -w 'deep link   %{http_code}\n' "$APP_URL/products"
curl -s -o /dev/null -w 'public API  %{http_code}\n' "$APP_URL/api/products"
curl -s -o /dev/null -w 'protected   %{http_code}\n' "$APP_URL/api/cart"     # expect 403
```

Then open `$APP_URL` in a browser and sign in with the seeded demo account:
`demo@knack.com` / `Demo@1234`.

This matrix was verified against the built JAR locally with
`SPRING_PROFILES_ACTIVE=cloud`: UI, deep links, and static assets return 200;
`/api/products` and `/api/categories` return 200; `/api/cart`, `/api/wishlist`,
and `/api/customers/me` return 403 unauthenticated and 200 with a valid JWT; the
H2 console returns 404.

---

## Operational constraints

**Do not scale beyond one instance.** H2 is in-memory, so every instance would
hold a *separate* database. Carts, orders, and registrations would land on
whichever instance the router picked, and users would see data appear and vanish
between requests. `instances: 1` in `manifest.yml` is a correctness requirement,
not a cost choice.

**All data is lost on every restart, redeploy, and crash.** `ddl-auto=create-drop`
plus in-memory H2 means `DataInitializer` reseeds the 12 demo products and the
demo customer on each boot; anything a user created is gone. This is fine for a
demo and unsuitable for anything anyone relies on. Moving to a persistent store
means binding a PostgreSQL or SAP HANA Cloud instance, adding the driver, and
switching `ddl-auto` to `update`.

**Routes are an org-wide quota.** `manifest.yml` pins a fixed route rather than
using `random-route`, so a redeploy reuses the same hostname instead of minting
another one against the quota each time — see *The org is out of capacity* below.
The pinned route's domain must exist in the target org; it follows the API
endpoint's region.

---

## Security notes (ISO 27001 / GDPR)

Applied in the `cloud` profile:

- **JWT secret externalized** and required — no committed-secret fallback.
- **H2 console disabled** (`spring.h2.console.enabled=false`). It is an
  unauthenticated SQL shell over the whole schema and was previously
  `permitAll` in `SecurityConfig`; on a public route that is a direct path to
  all customer records.
- **Stack traces suppressed** (`server.error.include-message=never`).
- **Encryption in transit** — BTP CF routes terminate TLS and serve https by
  default; the app trusts `X-Forwarded-Proto` via
  `server.forward-headers-strategy=framework`.

Worth doing before this handles any real personal data:

- **Turn Swagger off** — `cf set-env knackstore SWAGGER_ENABLED false` then
  restart. It currently publishes the full API surface to anonymous callers.
- **Restrict space access** so only the team that needs it can `cf ssh`,
  read `cf env` (which exposes `JWT_SECRET`), or view logs.
- **Ship logs to a retained store** — bind an Application Logging or
  OpenTelemetry service. CF's in-memory log buffer is small and lost on restart,
  so there is currently no audit trail of access to customer data.
- **Move the secret into a credential store** — a user-provided service or SAP
  Credential Store is preferable to `cf set-env`, which any Space Developer can
  read back in plaintext.
- **Consult the DPO before pointing this at real customer data.** The app seeds
  and stores names, emails, phone numbers, and addresses; a persistent database
  brings retention and erasure obligations (GDPR Art. 5(1)(e), Art. 17) that the
  current create-drop setup sidesteps only by keeping nothing.

---

## The org is out of capacity

```
Available memory is 0 MB
For route 'knackstore-....cfapps.<region>.hana.ondemand.com':
Routes quota exceeded for organization '<org>'.
```

Hit while targeting the `Knack systems, LLC_Knack-Commerce-Dev` org. Quotas are
per-org, so this does not apply to the `…_knack-coe-demo-test1` org now in use,
which has a 4,096 MB limit — ample for this app's 1 GB. Kept because the
diagnosis holds for any org that fills up.

Two independent quotas are exhausted. No change to the JAR or `manifest.yml` can
work around either — capacity has to be reclaimed in the org first. They behave
differently, which determines how you free them:

| Quota | What counts against it | How it is freed |
|---|---|---|
| **Memory** | Only **running** instances | **Stopping** an app releases its memory at once — you do not have to delete it |
| **Routes** | Every route that exists, running or not | Only **deleting the route**. Deleting an app leaves its route behind as an orphan that still counts |

So `cf stop` on a few idle apps solves the memory side non-destructively, and the
route side needs explicit route deletion.

### Memory: `Available memory is 0 MB`

This app needs **1 GB**. See what is consuming the quota — the `memory` column
times running instances:

```bash
cf apps                                                # current space
cf org <org-name>                                      # shows used/limit
```

Stop what nobody is actively demoing. This is reversible — `cf start` brings it
back unchanged, and stopped apps keep their route and configuration:

```bash
cf stop <app-name>
```

In the cockpit: subaccount → *Cloud Foundry* → *Spaces* → *(space)* →
**Applications**, then *Stop* on the row. Check every space in the org; the
memory quota is shared across all of them.

If you cannot free a full gigabyte, you can try lowering `memory:` in
`manifest.yml` to `768M`. Be aware this is untested here — the only sizes
verified for this app are the local run and the 1 GB setting — and Spring Boot
3.2 with JPA, Hibernate, security, and springdoc is genuinely tight at 768 MB. If
the app boots and then dies, `cf logs knackstore --recent` will show the
buildpack memory calculator failing or a heap OOM; go back to 1 GB.

### Routes: `Routes quota exceeded`

The org has consumed every route its quota plan allows, so no new hostname of any
kind can be created. **Orphaned routes still count**, so an org that has hosted
many hackathon apps typically has a large pool of routes bound to nothing.

Check the usage (the `routes` line shows used/limit):

```bash
cf org <org-name>
cf routes                 # current space
cf routes --org-level     # every space in the org
```

Then, in order of preference:

**1. Delete routes bound to nothing.** Lowest risk — these serve no traffic.

```bash
cf delete-orphaned-routes          # prompts before deleting
```

Run it per space (`cf target -s <space>`) since it only covers the current one.

**2. Delete routes belonging to apps that are finished with.** In `cf routes`,
the `apps` column tells you what would break. Only remove routes for apps nobody
is demoing.

```bash
cf delete-route cfapps.us21-001.hana.ondemand.com --hostname <host>
```

**3. Reuse a route you already own** instead of creating one. Point the `route:`
entry in `manifest.yml` at an existing route in your space and remap it — this
consumes no additional quota.

**4. Ask for the quota to be raised.** The org quota plan is set at the global
account level, so this needs whoever administers your BTP global account. `cf
update-org-quota` will fail without those rights. Given both memory and routes
are exhausted at the same time, this org is simply undersized for the number of
apps now in it — a quota increase is likely the real fix rather than repeatedly
reclaiming scraps.

Without the cf CLI, the same operations are in the **BTP cockpit**: subaccount →
*Cloud Foundry* → *Spaces* → *(space)* → **Routes**, which lists each route and
the app it maps to, with a delete action per row. Check every space in the org —
the quota is shared across all of them, so the routes filling it may not be in
the space you are deploying to.

> Deleting a route is immediately visible to anyone using that URL. Confirm with
> the owning team before removing anything that still maps to a running app.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Could not resolve placeholder 'JWT_SECRET'` | The variable is not set on the app. Cockpit: *User-Provided Variables* (step 4, Option A). CLI: `cf set-env`, then `cf start knackstore`. Surfaces as `Unable to start web server` → `jwtAuthFilter` → `jwtUtil` — read to the last `Caused by`. |
| Blank page, 404 on `/` | JAR built without the bundle. Re-run `./build-cf.sh` — step 3 fails loudly if the bundle is missing. |
| Deep link 404s, but `/` works | `SpaWebConfig` not on the classpath, or `SPRING_PROFILES_ACTIVE` isn't `cloud`. Check `cf env knackstore`. |
| `Available memory is 0 MB` / `Insufficient resources` | Org memory quota exhausted — see *The org is out of capacity* above. |
| `Host is taken` | Another app on `cfapps.us21-001` already uses that hostname. Change the suffix in the `routes:` entry in `manifest.yml`. |
| `Routes quota exceeded for organization` | Org route limit reached — see *Route quota exceeded* above. |
| App starts then crashes | `cf logs knackstore --recent`. 1 GB is sized for Spring Boot 3.2 + H2; below ~768 MB it will OOM. |

---

## What this deployment added

| File | Purpose |
|---|---|
| `manifest.yml` | CF app definition — buildpack, JRE 17 pin, memory, `cloud` profile |
| `build-cf.sh` | Angular build → JAR packaging → bundle-embedded assertion |
| `backend/src/main/resources/application-cloud.properties` | `$PORT` binding, H2 console off, required `JWT_SECRET`, forwarded headers |
| `backend/src/main/java/com/knack/store/config/SpaWebConfig.java` | Serves `classpath:/static`; forwards unmatched non-API paths to `index.html` for the Angular router |
| `backend/pom.xml` | `cf` profile copying `frontend/dist/electronics-store-ui` into the JAR as `static/` |
| `backend/.../config/SecurityConfig.java` | `/api/**` stays authenticated; all other paths public so SPA routes reach `SpaWebConfig` |
