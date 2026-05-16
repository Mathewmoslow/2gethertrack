# 2getherTrack

Static trainer tracking app hosted for free on GitHub Pages.

## Live App

https://mathewmoslow.github.io/2gethertrack/

## Repository

https://github.com/Mathewmoslow/2gethertrack

## Current State

- Firebase project is built in: `togethertrack-8d603`
- Auth mode is Email/Password only
- Google sign-in has been removed
- Local-only mode has been removed
- In-app Firebase project switching has been removed
- Data syncs through Firestore under `users/{uid}/...`

## Files

- `2gethertrack.html` - main app
- `index.html` - redirects to the main app page
- `SETUP.md` - Firebase setup and troubleshooting notes

## Firebase Console Checklist

1. Enable Authentication -> Email/Password.
2. Create Firestore in production mode.
3. Publish the rules in `SETUP.md`.
4. If auth rejects the hosted domain, add `mathewmoslow.github.io` under Authentication -> Settings -> Authorized domains.

## Update And Deploy

Any commit pushed to `main` deploys automatically through GitHub Pages.

```sh
git status
git add .
git commit -m "Describe change"
git push
```

GitHub Pages URL stays the same after each deploy.
