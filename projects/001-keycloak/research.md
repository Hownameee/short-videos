# Keycloak: follow the login

Verified 2026-10-26 against official sources. Scope: browser public client, authorization code with S256 PKCE. This is a conceptual explainer, not a complete secure-client implementation tutorial.

- claim-1: Keycloak is an OpenID Connect provider; OIDC adds identity to OAuth 2.0.
- claim-2: The illustrated public browser app redirects to Keycloak for authentication, then receives an authorization code.
- claim-3: PKCE binds the code exchange to a verifier generated before the authorization request.
- claim-4: The token response includes an ID token for the client and an access token used for protected resources.
- claim-5: A resource server validates access tokens and enforces permissions; signed tokens can be checked locally using public keys.

- [JavaScript adapter](https://www.keycloak.org/securing-apps/javascript-adapter)
- [Securing applications with OpenID Connect](https://www.keycloak.org/securing-apps/oidc-layers)
- [OpenID Connect Core 1.0, errata 2](https://openid.net/specs/openid-connect-core-1_0.html)
- [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636)

Omissions: refresh, logout, federation, nonce/state, discovery and detailed validation algorithm. Do not imply OAuth alone authenticates users, every API call contacts Keycloak, or an ID token authorizes API access.
