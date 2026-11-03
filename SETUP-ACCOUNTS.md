# ArenaStrike accounts update — Beta 1.6.6

The game still runs on GitHub Pages. Supabase handles accounts, shared progress,
developer permissions, reports, rankings and published Battle Simulator levels.
Guest play and guest saves remain available.

## What is already configured

- Project: `bjwjkhkfbismtipworth`.
- Database tables, row-level security, account functions and developer permissions.
- Game URL and email-confirmation redirects:
  https://barebonesshooters.github.io/ArenaStrike/
- A reserved first-owner email. Ownership is granted only after that address is
  verified and the user opens the game's Account page.
- Two deployed billing functions, with purchases disabled on the server.
- Draft Supporter, Builder and Champion plans. Prices and rewards are undecided.

Do not rerun the initial SQL migration against this project: it is already applied.
The included `supabase` folder is source for maintenance or a fresh project, not a
folder that GitHub Pages executes.

## Upload the game update

1. Extract the ZIP. Read `UPLOAD-INSTRUCTIONS.txt`.
2. Upload the contents of `game-files` into the existing repository, preserving
   their relative paths. Replace matching files; do not upload the enclosing
   `game-files` directory itself.
3. Commit on the branch that your GitHub Pages deployment uses.
4. Wait for that deployment to complete, then reload the game. The title should
   display Beta Version 1.6.6. On iPhone, close and reopen an installed home-screen
   copy if it still has the old page open.

This is a patch ZIP. Keep the repository's other game files, icons and preview image.
`js/vendor` contains the Supabase browser SDK and its license; upload that directory
inside `js` along with the other new JavaScript files. No Node build is required.

## Email delivery: still required before public registration

Supabase's default email sender is for development and only sends to project-team
addresses. Public verification, password-reset and email-change messages need an
SMTP provider. Keep email confirmation enabled.

Brevo's free plan currently includes 300 emails per day. Create a free Brevo
account and verify your email, then configure its transactional SMTP credentials
in Supabase's Authentication email settings. Use an SMTP key, not your normal
email-account password. Test sign-up and password reset to an address outside
the Supabase project team before announcing public accounts.

Without your own domain, Brevo temporarily replaces the sender address. This is a
starter option; its documentation recommends an authenticated custom domain for
long-term delivery. The game may remain on its existing GitHub Pages URL.

References:
- https://supabase.com/docs/guides/auth/auth-smtp
- https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan
- https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders

## Accounts and developer access

Create an account using the reserved owner address, confirm the email, then sign
in to the game. Developer panel appears in the sidebar. Owners can assign roles
to existing players and create one-use developer invitations that expire after
24 hours. Players redeem those invitations after signing in.

Developer permissions come from the database. The old shared game password does
not grant server access. The public reward code `DEV` still grants cosmetic items;
it does not make someone a developer. Developer access returns after reloading
or signing in on another device. An owner can revoke it.

In-game developer access does not automatically grant Supabase dashboard access.
Project infrastructure access is managed separately through Supabase's team settings.
The developer panel shows recent signed-in activity, reports, rankings information
and an action log. It is not an analytics system for every anonymous website visit.

Signed-in Battle Sim Maker publishes directly to Supabase. Other players can use
Refresh levels to load published levels without a GitHub commit. Conflicting edits
are rejected rather than overwriting another developer's version.

## Saves and settings

Guest saves and each account's progress are separate. The first account save can
import the current guest progress. Existing cloud progress is loaded at sign-in.
If another device has a newer save while this device has unsynced changes, Account
asks which to keep and stores a local backup before replacing the device's save.

Graphics, audio, sensitivity, scope behavior and touch preferences stay on the
device. Gameplay progress and inventory sync while signed in. Offline progress is
kept locally and retried when connected; clearing browser storage before a successful
sync can remove those pending changes. Account includes Download my save.

Reports require sign-in and appear in the developer panel. Developers can update
their status and leave a reply visible to the reporter. Reports do not automatically
ban players. Do not put credentials or payment information in reports.

Rankings use client-reported results with duration, bounds and duplicate-run checks.
They are not cheat-proof. Developer Grinding Mode and custom battles are excluded.
Players can opt out of the public leaderboard in Account.

## Paid plans: placeholders only until Stripe setup is completed

No checkout is available in this update. Do not enable payments merely by editing
the browser configuration. Before going live:

1. Create and activate your Stripe account yourself, including its required business,
   identity and payout details. Decide the tiers, currency, prices and item rewards.
2. Use Stripe test mode first. Create recurring prices and configure the customer
   billing portal. Store each price ID and matching amount/currency/interval through
   the owner-only plan form. Amounts use the currency's minor units.
3. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function
   secrets. Keep all secret keys out of GitHub and the browser config.
4. Add this Stripe webhook endpoint:
   `https://bjwjkhkfbismtipworth.supabase.co/functions/v1/arena-stripe-webhook`
   Subscribe to `invoice.paid`, `invoice.payment_failed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `charge.refunded`, and `charge.dispute.created`.
5. Test checkout, confirmation, duplicate and delayed events, renewals, cancellations,
   failures, refunds and disputes end to end. These real Stripe flows have not been
   tested yet because the account and prices are not configured.
6. Only after that validation, enable `PAYMENTS_ENABLED` on the server and
   `paymentsEnabled` in `js/supabase-config.js`, then upload that public config.
   Use matching live-mode keys, prices and webhook signing secret for live payments.

Successful paid billing periods can create one reward grant per invoice. The game
checks for new grants when an account loads and while it remains active. Cancellation
stops future paid grants; it does not remove previously earned permanent cosmetics.
Refunds/disputes flag existing unclaimed grants. Already-claimed rewards require
manual review; full refund clawback and all event-order edge cases need review before
launching paid plans. Saves remain client-controlled, so inventory is not a secure
paid-entitlement system against modified browsers.

## Validation performed

- Database migration, private saves and reports, ownership verification, role
  revocation, one-use invitations, save/publication conflicts, checkout leases,
  server-only payment access and duplicate reward protection.
- Local browser checks with a mocked account server: sign-in, saved developer role,
  reload, syncing, conflict resolution, report submission, escaping and guest isolation.
- Desktop 1440×900 and mobile 390×844, 320×568 and 667×375 layouts; touch-button bounds,
  maker/hotbar spacing and JavaScript runtime errors.
- Tower stair traversal in all four directions at 30, 60 and 144 simulation FPS.
- Live anonymous API checks: private saves/roles rejected; public rankings/levels
  readable; checkout disabled; unsigned payment events rejected.
- Supabase security advisor review: informational entries for deliberately closed
  server-only tables and warnings for deliberately exposed, guarded database functions.
  These are not an independent security audit.

Public email delivery and real payment flows still require the setup above.
The larger High graphics redesign is deferred for a separate pass.
