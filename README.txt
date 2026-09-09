Dungeon Logic — Task 43 build hotfix

This patch performs exactly two changes:
1) Removes src/dev/campaignThemeSanity.ts (obsolete chapter/theme sanity).
2) Removes the obsolete onboarding property from src/dev/campaignSanity.ts.

Apply from the repository root:

  git apply task43-hotfix.patch
  npm run build

The patch was verified with `git apply --check` against a representative copy of the current Task 43 tree with the legacy campaignThemeSanity.ts leftover present.
