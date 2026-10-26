# What happens when you log in with Keycloak?

Audience: developers. Target: 60–80 seconds, measured after narration. Tone: curious and precise.

Direction A explicitly selected. User delegated all remaining decisions and requested final video; agent accepts the script under that delegation.

Hook: why does login send you somewhere else? Promise: follow one browser login. Payoff: Keycloak handles identity and tokens; API enforces access. CTA: trace the steps in your own app.

## Why the detour?

You clicked Log in. Why did your app send you somewhere else? Follow one login through Keycloak.

Visual: Login button becomes a route from app to Keycloak. Cue: Log in. Settle: Route remains visible. Sources: claim-2.

## 01 / Authenticate

In this browser app, Keycloak handles sign-in. Your app redirects you there, with a challenge for a security check called PKCE. You enter your password on Keycloak.

Visual: Browser address changes; challenge travels to Keycloak; password is entered only there. Cue: redirects. Settle: Keycloak shows authenticated state. Sources: claim-2, claim-3.

## 02 / Exchange

After sign-in, Keycloak sends your browser back with a short-lived authorization code. Your app exchanges that code, plus its original secret verifier, for tokens. PKCE checks that they match.

Visual: Code returns to browser; code plus verifier travel to token endpoint; match reveals tokens. Cue: authorization code. Settle: Tokens arrive at app. Sources: claim-3, claim-4.

## Two tokens. Two jobs.

The ID token tells the app about your sign-in. The access token goes with requests to your API. Different tokens. Different jobs.

Visual: Token response separates into ID token staying in app and access token traveling to API. Cue: ID token. Settle: Distinct destinations hold. Sources: claim-1, claim-4.

## 03 / Access

The API validates the access token, including its signature, issuer, audience, and expiry, then checks permission. Only then does it return the protected data.

Visual: Request passes token validation and permission gates, then response returns. Cue: validates. Settle: Protected data returned. Sources: claim-5.

## Now the detour makes sense.

Keycloak handles sign-in and issues tokens. Your API still enforces access. Trace those steps in your own app.

Visual: Three completed steps connect in final route. Cue: Keycloak. Settle: Full journey resolves. Sources: claim-1, claim-5.

Music: original sparse electronic score, curiosity in hook, softer under explanation, brighter resolution under payoff, final fade. Gain and voice ducking baked into asset; no doubled fades. Captions: provider word timings, two-line phrase groups. Pronunciation: Key cloak, pixie, A P I, I D token. Conceptual public browser-client flow; state/nonce/refresh and full configuration are outside scope.
