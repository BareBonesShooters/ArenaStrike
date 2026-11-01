# Manage reward codes with GitHub Secrets

Use your existing repository: [bare-bones-3d/shooter](https://github.com/bare-bones-3d/shooter). No new repository is needed.

## One-time setup

1. Upload the update files to the **same paths** in your existing repository. Replace existing files and add the new ones. Do not upload the ZIP itself or an extra outer folder.
2. Open **Settings → Secrets and variables → Actions → Secrets → New repository secret**. Name it **GAME_CODES**. Paste this as the value:

   ```json
   {
     "DEV": { "items": ["s_dev", "p_dev"] },
     "BONUS": { "coins": 5000 }
   }
   ```

   This enables `DEV` for the Dev skin and outfit, and `BONUS` for 5,000 coins. Replace `BONUS` with your own code if you want to keep it private. Use **Secrets**, not Variables. Keep the JSON in the secret field; do not commit your real private codes to a file.
3. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. You need the repository owner's help if you cannot change this setting. The included workflow handles deployment; you do not need to create another one from a template.
4. Open **Actions → Deploy game → Run workflow**, choose **main**, then click **Run workflow**. Wait for both build and deploy to turn green. A run triggered before you created the secret or enabled Pages might fail; run it again after completing these steps.
5. Open the game URL shown by the successful deployment, normally [bare-bones-3d.github.io/shooter](https://bare-bones-3d.github.io/shooter/). Refresh the game, select **Redeem codes** and enter a code.

GitHub's instructions: [create a repository secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets) and [use GitHub Actions for Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Adding or changing codes later

1. Open the `GAME_CODES` secret and replace its value with your **complete updated list**. Keep the entries you still want active. GitHub does not show the old secret value, so keep your own private copy.
2. Open **Actions → Deploy game → Run workflow → main → Run workflow**.
3. Wait for the green deployment, then refresh the game.

Changing a secret alone does not deploy it. A push to `main` also runs this workflow. Removing an entry disables that code after deployment and a page refresh; already earned rewards remain. Codes are once per browser save, so changing a code's reward does not let previous claimants collect it again. Give the new reward a different code to allow another claim. Use `{}` to disable all reward codes. A missing or invalid secret stops deployment and leaves the last successful site live.

Example with coins and both Dev cosmetics:

```json
{
  "DEV": { "items": ["s_dev", "p_dev"] },
  "SUMMER-GIFT": { "coins": 5000 },
  "SPECIAL-GIFT": { "items": ["s_dev", "p_dev"], "coins": 1000 }
}
```

Use double quotes and commas between entries, with no comma after the last entry. Codes ignore case and surrounding spaces, are 1–64 characters long, and use letters, numbers, hyphens and underscores. Start with a letter or number. `items` must contain existing game item IDs; `coins` must be a nonnegative whole number. Include at least one item or a positive coin amount. This feature grants existing items; new skin designs still need game code.

The Custom mode developer password is separate and remains unchanged.

## Upload paths if you cannot drag folders

Upload each file **inside its matching GitHub folder**. For a missing folder, use **Add file → Create new file**, type the full path including `/`, then paste that file's text. GitHub creates the folders for you. In particular, create the workflow as `.github/workflows/deploy-pages.yml`, including the leading dot.

| GitHub folder | Files to upload |
| --- | --- |
| Repository root | `index.html`, `README.md`, `SETUP-CODES.md`, `.gitignore` |
| `js` | `01-core.js`, `10-ui-pages.js`, `reward-codes.js` |
| `scripts` | `build-pages.cjs` |
| `tests` | `rewards.test.cjs`, `build-pages.test.cjs`, `game-harness.cjs` |
| `.github/workflows` | `deploy-pages.yml` |

The tests are required by this workflow. The ZIP contains only changed/new files; keep the other existing game files. If Windows hides `.github`, turn on hidden items in File Explorer or create the workflow using the full path on GitHub.

## What is public

The deployed game contains only code hashes and rewards, never the raw `GAME_CODES` secret. Build logs do not print secret values, including on malformed JSON. The build publishes only game HTML, CSS and JavaScript, excluding tests and build scripts.

This is a browser-only game: short codes can be guessed from their hashes, and players can modify their own local saves. Use long random game-only codes if you want them harder to guess. Secure, account-based validation requires a server. The Dev code was already public, so moving it into a secret does not remove it from old commits or documentation.
