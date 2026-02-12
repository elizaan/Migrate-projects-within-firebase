# Firebase Migration Scripts

Two scripts migrate Firebase data between projects:
- `migrate-db.js` copies Firestore collections listed in the script from source to destination in batches.
- `migrate-storage.js` copies all files from the source Storage bucket to the destination bucket, preserving content type.

## Run

```
npm install
npm init -y
npm install firebase-admin @google-cloud/storage
node migrate-db.js
node migrate-storage.js
```

## Required keys (place in repo root)

You must add `source-key.json` (source project service account).
You must add `dest-key.json` (destination project service account).
