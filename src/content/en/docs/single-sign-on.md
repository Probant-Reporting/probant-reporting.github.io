---
title: "Sign in with a company account"
description: "This page explains how people can sign in to the tool with their company account, through OpenID Connect. Sections 1 to 3 are for the space managers who…"
order: 4.5
group: "Run"
source: "docs/single_sign_on.md"
---

This page explains how people can sign in to the tool with their company account, through OpenID Connect. Sections 1
to 3 are for the space managers who set it up. Section 4 is for the person who manages the identity provider. Sections
5 to 8 are for everyone who supports the tool, IT included.

The feature works with any standard OpenID Connect provider, for example Microsoft Entra ID, Google, Okta or Keycloak.
The tool has no code that is specific to one provider.

---

## 1. What it does and what it does not do

The company account **only proves who the person is**. Everything else stays in the tool.

| Question | Answer |
|---|---|
| Does the tool create an account at the first sign-in? | No. An administrator creates the account in **Administration › Accounts**, as before. |
| Does the tool take the role, the team or the assignments from the provider? | No. The role and the assignments are set in the tool, space by space. |
| How does the tool find the account? | By the email address. The provider must say that the address is verified. Upper and lower case do not matter. |
| What if two accounts have the same address? | The sign-in is refused. |
| What if no active account has this address? | The sign-in is refused with a simple message: “Ask your administrator to create your account”. The message never says if the address exists. |
| Does it change something after an update? | No. Company sign-in is off until a space manager turns it on. |
| Does sign out also sign out of the provider? | No. **Sign out** closes the session in the tool only. The session at the provider stays open: the next click on the button can sign the person in again without a password. |
| Is it one setting per space? | No. One setting for the whole installation, because accounts are shared by all the spaces. |

---

## 2. Before you start

- You must be a **space manager**. Only space managers see **Administration › Settings › Company sign-in**.
- IT allows outgoing HTTPS (TCP 443) from the server to the provider. The tool calls the provider only when a person
  clicks the button, when the provider sends the person back, and when you check or save the settings.
- IT sets `PUBLIC_URL` in `.env` (for example `https://reporting.example.com`). The tool builds the redirect URI from
  it. Without `PUBLIC_URL`, the tool uses the address of the page that you opened.
- The all-in-one version (Windows or Mac) does not include company sign-in.

---

## 3. Set it up, step by step

1. At your provider, register the tool as a web application (section 4). Keep three values: the **issuer** address,
   the **client ID** and the **client secret**.
2. In the tool, go to **Administration › Settings › Company sign-in**.
3. Copy the **Redirect URI** that the page shows, with **Copy**, into the settings of the application at your
   provider. It is always the address of the root of the tool followed by `/connexion/entreprise/retour/`, for all
   spaces.
4. Enter the **Provider address (issuer)**, the **Client ID** and the **Client secret**.
5. Click **Check the provider**. The tool reads the settings of the provider and its signing keys. It shows what is
   missing. Nothing is saved.
6. Optional: enter a **Button text**, for example with the name of your company account. When it is empty, each person
   sees the default text in their own language.
7. Select **Allow sign-in with the company account**, then click **Save**. The tool checks the provider again before
   it turns the feature on. If something is missing, it saves the rest and the feature stays off.
8. Open the sign-in page in a private window and try with an account that exists in the tool.

The client secret is saved encrypted. It is never shown again, and never written to the log, to a backup, to the
archive of the shared registry or to the configuration export. To replace it, enter a new one and save. To delete it,
click **Remove the secret**: company sign-in turns off. To keep it, leave the field empty. If you change the issuer
address or the client ID, the tool deletes the saved secret, so that it never goes to another provider: enter it again
in the same save. Until then, company sign-in is off and everyone signs in with their password.

### The two safety choices

Both are off by default. Keep them off unless you have a reason.

| Choice | Off (recommended) | On |
|---|---|---|
| **Everyone can still sign in with their password** | Only the space managers keep their password, as rescue accounts. A person that the company blocks at the provider can no longer sign in. | Everyone can also use the password of the tool. A person blocked at the provider can still sign in with it. |
| **Accept an email address when the provider does not say if it is verified** | The provider must send `email_verified: true`. | An address without `email_verified` is accepted. An address with `email_verified: false` is always refused. |

---

## 4. At your provider

### What every provider needs

| Setting | Value |
|---|---|
| Type of application | Web application (confidential client), with a client secret |
| Flow | Authorization code. The tool always sends PKCE with `S256`. |
| Redirect URI | The address shown on the page (step 3) |
| Scopes | `openid email` |
| Signature of the ID token | RS256, RS384, RS512, PS256, PS384, PS512, ES256, ES384 or ES512. Shared-key signatures (HS256) and unsigned tokens are refused. |
| Claims of the ID token | `email` and, unless you turned on the second safety choice, `email_verified` |
| Client authentication | `client_secret_basic` (preferred) or `client_secret_post` |

Restrict at the provider who can use the application (assignment of users or groups), when the provider offers it.
The tool also refuses everyone who has no active account in the tool.

### Remarks for some providers

Check the current documentation of your provider: the names of the menus change.

- **Keycloak.** Issuer: `https://<host>/realms/<realm>`. Create an OpenID Connect client with **Client authentication**
  on and **Standard flow** on. Put the redirect URI in **Valid redirect URIs**. You can force PKCE (`S256`) in the
  advanced settings of the client. Keycloak sends `email_verified` from the **Email verified** field of each user.
- **Google.** Issuer: `https://accounts.google.com`. Create an OAuth client of type **Web application** and add the
  redirect URI. For a Google Workspace organisation, set the consent screen to **Internal**, so that only the accounts
  of your organisation can sign in. Google sends `email_verified`.
- **Okta.** Issuer: your Okta domain (`https://<domain>`) or the address of your authorization server (for example
  `https://<domain>/oauth2/default`). Create an **OIDC – Web Application** integration with the redirect URI as
  **Sign-in redirect URI**, and assign it to the people or groups. Okta sends `email_verified` with the `email` scope.
- **Microsoft Entra ID.** Issuer: `https://login.microsoftonline.com/<tenant ID>/v2.0`, with the ID of your tenant. The
  shared addresses (`common`, `organizations`) are refused, because their settings do not give the issuer of your
  tenant. Register a single-tenant application, add a **Web** platform with the redirect URI, create a client secret,
  and add the optional claim `email` to the ID token. Entra does not send `email_verified`: by default, the tool then
  refuses the sign-in (section 8). Turn on the second safety choice only if these three conditions are true: the
  application is single-tenant, **Assignment required** is on, and only your company administrators set the email
  addresses of the users in the directory (no guest accounts assigned to the application).

---

## 5. Rescue accounts: you cannot lock yourself out

- The **space managers** always keep their password, also when company sign-in is on. The person who turns it on is a
  space manager: they can always sign in with their password and turn it off.
- If the provider is down, the button gives a message, and the space managers sign in with their password. When they
  turn company sign-in off, everyone can use their password again.
- If no space manager can sign in, IT turns company sign-in off for the whole installation: `COMPANY_SIGN_IN=off` in
  `.env`, then `docker compose up -d`. The button disappears and everyone can use their password. The setting in the
  tool is kept: remove the variable to turn company sign-in on again.
- A space manager whose account is blocked (**Block** in **People and access**) is no longer a rescue account.

Make sure that at least two people are space managers.

---

## 6. What changes for the people

| Item | With company sign-in on |
|---|---|
| Sign-in page | A button at the top, then the email and password fields for the rescue accounts. |
| Temporary password | When a person cannot use a password, the tool does not ask them to replace their temporary password. |
| Password of the tool | Refused for everyone except the space managers (unless the first safety choice is on). Every failed password sign-in gets the same message, whether the password is right or wrong: “Incorrect email or password”, with a hint to use the company account button. The page never confirms that an account exists. |
| Assistant tokens (MCP) | A person who cannot sign in with a password cannot use assistants: their tokens are refused at once (the assistant gets a clear message), and **My account** does not let them create new ones. A token cannot follow what the company decides (account blocked, person gone). Space managers keep their tokens, and so does everyone when **Everyone can still sign in with their password** is selected. When company sign-in is turned off, the earlier tokens work again until they expire. An administrator can revoke tokens in **Administration › Settings › Assistants**. |
| Session | Same duration as before (12 hours). A session opened with a password follows the password rule at each page: when company sign-in is turned on, or when a space manager loses this role, a person who may no longer use a password is signed out at the next page and asked to sign in with the company account. Sessions opened with the company account are not affected. |
| Sign-in history | Each line shows the method (**Password** or **Company account**). A refused company sign-in shows a short reason. No token and no network address is ever kept. |
| Blocking after failures | Unchanged for passwords. A company sign-in never counts as a password failure. Refusals that need no account at the provider (expired or replayed sign-in, provider error) count for the network address: after 30 in 15 minutes, the button is refused from this address for 15 minutes. A refusal after the person signed in at the provider (no account in the tool, for example) counts only for this person: after 10 in 15 minutes, this person is refused for 15 minutes. It never blocks the other people behind the same company proxy. When company sign-in is off, the return address writes nothing. |

### Link with the company account

At the first sign-in, the tool links the account to the company account that opened it (the `sub` identifier of
the provider, which does not change when the email address changes). A later sign-in with the same address but another
company account is refused. If your provider gives an address to another person, remove the link of this address in
**Links to company accounts**: the next sign-in creates a new link.

---

## 7. Security

What the tool checks at each sign-in:

- `state` (single use, 10 minutes), `nonce` and PKCE `S256` code verifier, all random and kept in the session;
- the signature of the ID token with the published keys of the provider (key rotation is followed: an unknown key makes
  the tool read the keys again, at most once a minute);
- `iss` equal to the issuer of the provider, `aud` that contains the client ID (`azp` equal to it when there are
  several audiences), `exp` and `iat` (with 60 seconds of margin for the clocks);
- the page asked for after the sign-in (`next`): only an address of the tool, never another site.

The address of the provider is entered by a space manager. To limit what the server can be made to call:

- `https` only; no address of the server itself (`127.0.0.0/8`, `::1`), no link-local address (`169.254.0.0/16`, for
  example the metadata service of a cloud host), no other known metadata service (AWS and Google over IPv6, Alibaba,
  Oracle, Azure), no multicast or reserved address. Private addresses stay allowed,
  for a provider inside the company network.
- The tool checks the address again after it connects, follows no redirect, reads only JSON, at most 1 MB, with a
  short timeout (5 seconds, `COMPANY_SIGN_IN_TIMEOUT`).
- **Check the provider** shows only a short reason, never the content of the answer.

The content security policy of the pages, the CSRF protection and the session rules do not change. The button is a
link, so the policy keeps `form-action 'self'`.

---

## 8. Troubleshooting

| What the person sees | Probable cause | What to do |
|---|---|---|
| “Your company account does not match an account of this tool” | No active account with this address, two accounts with this address, the account is blocked, or the address is linked to another company account. | Check **Administration › Accounts** and the email address. Look at the reason in the **Sign-in history**. Remove the link if the address changed owner. |
| “Your company did not confirm your email address” | The provider sends no `email`, or sends `email_verified: false`, or sends no `email_verified`. | Add the `email` claim at the provider. Mark the address as verified at the provider. For a provider that never sends `email_verified`, read section 4. |
| “Sign-in with your company account did not work” | The provider does not answer, the client secret is wrong, the clocks differ by more than one minute, or the token is refused. | Click **Check the provider**. Read the log of the tool: `docker compose logs web \| grep connexion_entreprise` gives the technical reason (never a token). |
| “The sign-in took too long or was already used” | The person waited more than 10 minutes at the provider, used the back button, or the settings changed meanwhile. | Click the button again. |
| “Sign in with your company account (button above)” | The person typed their password, but only the space managers can still use it. | Use the button. |
| The button does not appear | Company sign-in is off, incomplete, or turned off by IT (`COMPANY_SIGN_IN=off`). | Open **Administration › Settings › Company sign-in**. |
| **Check the provider**: “The provider gives another issuer address” | The issuer entered is not exactly the one the provider publishes. | Copy the `issuer` value of the provider exactly (for Microsoft Entra ID, use the address with your tenant ID). |
| **Check the provider**: “Address refused” | `http`, an address of the server itself or a link-local address. | Use the `https` address of the provider. |
| “The saved client secret can no longer be read” | The secret key of the installation changed (`DJANGO_SECRET_KEY`, or a restore on another server). | Enter the secret again. |

After a restore of the shared registry (`restore --shared`), company sign-in is off and the links with the company
accounts are removed (they are never in the archive): set it again. Until then, everyone signs in with the password
of the tool that the archive holds. The command lists what it reset.
