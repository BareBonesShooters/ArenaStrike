# Add reward codes

Open `js/01-core.js` in your existing GitHub repository and click the pencil to edit it. The code list is at the very top, under **EDIT REWARD CODES HERE**.

```js
const REDEEM_CODES = {
  "DEV": { items: ["s_dev", "p_dev"] },
  // "BONUS": { coins: 5000 },
  // "GIFT": { items: ["s_dev", "p_dev"], coins: 1000 },
};
```

`DEV` is already enabled. Lines beginning with `//` are disabled examples. To enable `BONUS`, remove the two slashes from its line. You can change its name and coin amount:

```js
const REDEEM_CODES = {
  "DEV": { items: ["s_dev", "p_dev"] },
  "WELCOME": { coins: 5000 },
  "SPECIAL": { items: ["s_dev", "p_dev"], coins: 1000 },
};
```

Click **Commit changes**. After your usual GitHub Pages deployment finishes, refresh the game. Players enter the code on the **Redeem codes** screen.

| Reward | Entry to copy |
| --- | --- |
| Coins | `"MYCODE": { coins: 5000 },` |
| Dev weapon skin | `"MYCODE": { items: ["s_dev"] },` |
| Dev outfit | `"MYCODE": { items: ["p_dev"] },` |
| Both plus coins | `"MYCODE": { items: ["s_dev", "p_dev"], coins: 1000 },` |

Keep a comma after each entry. Use each code name once; case and surrounding spaces do not matter. Names can use 1–64 letters, numbers, hyphens or underscores, starting with a letter or number. Other existing game item IDs work in `items` too. New skin designs still need to be added to the game first.

To disable a code, delete its line or put `//` at the start of the line. Already earned rewards remain. Each code is once per browser save, including claims from the previous versions. Use a new code name to give previous claimants another reward.

The list is visible in the game's source. Use game-only reward codes. Custom mode still uses its separate developer password.

## Installing this simpler version

Only two replacements are needed for gameplay and deployment:

1. Replace `js/01-core.js` in the existing `js` folder.
2. Replace `.github/workflows/deploy-pages.yml` in the existing `.github/workflows` folder.

The updated workflow copies the game directly to Pages. It needs no `GAME_CODES` secret, reward manifest generation, build script or tests to deploy. If GitHub Pages uses GitHub Actions, wait for **Deploy game** to turn green after committing. If you have not changed the Pages source to GitHub Actions, select that setting once before using this workflow.

The old `js/reward-codes.js` file is ignored by the game, so leaving it or its script tag in place is harmless. The old `GAME_CODES` secret is no longer read. There is no need to delete either to start using this version.

The full update bundle also includes refreshed documentation, tests and an optional local preview builder. These files help development; the two replacements above are sufficient for the game and deployment.

For local checks: `node --test tests/rewards.test.cjs tests/build-pages.test.cjs`. Run `node scripts/build-pages.cjs` only if you want a separate `_site` preview folder. Codes work on HTTPS sites such as GitHub Pages and on localhost. Hashed saved claim IDs remain compatible with the previous version.
