Dungeon Logic - pre-release profile squash patch

1. Extract ALL files from this archive directly into the project root
   (the folder containing package.json).
2. Run apply-profile-squash.cmd.

The launcher resolves the project directory from its own location; it does
not pass a quoted trailing-backslash path from CMD to PowerShell.

The script runs `git apply --check` first. Only if that succeeds does it
apply prerelease-profile-squash.patch.
