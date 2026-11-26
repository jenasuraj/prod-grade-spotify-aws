# Browser → S3 uploads (presigned URLs)

## What it is

The browser uploads a file **straight to S3**, without the bytes passing through our API.
The API only decides _who_ may upload _what_ and _where_, and hands out a short-lived permission.

```
Browser ──small JSON──▶ API      (auth, validation, key, signing)
Browser ──file bytes──▶ S3       (API not involved)
```

**Why:** routing files through the server (e.g. multer `memoryStorage`) holds each file in RAM.
100 users × 100 MB = 10 GB. Direct uploads cost the server ~0 RAM and ~0 bandwidth.

## Presigned URL

A normal S3 URL plus a signature the API computes with its AWS secret:

```
https://<bucket>.s3.<region>.amazonaws.com/<key>
  ?X-Amz-Credential=...&X-Amz-Date=...&X-Amz-Expires=900&X-Amz-Signature=...
```

- Signed **locally** with `getSignedUrl()`: no AWS call, instant, free.
- Locked to **one method + one key**, valid for a few minutes. Tampering breaks the signature (403).
- The browser gets the signature, **never** the AWS credentials.
- URLs expire, so store the **key** in the db, never the URL. Sign a new one when needed.
- Same idea for reading private files: sign a `GET` (what `S3Service.signedUrl` does for avatars).

## Flow (single file)

```
1. POST /api/<thing>/upload-url  { fileName, size, contentType }
   API: check auth, size and type
        key = <folder>/<userId>/<uuid>          (server picks it, never the client)
        url = sign(PUT, key, 15 min)
      ← { key, url }

2. Browser: PUT file → url                     (straight to S3)

3. POST /api/<thing>  { key }                  "upload finished"
   API: key must be under this user's folder   (can't claim someone else's file)
        HeadObject(key): exists? size and type OK?
        save key in the db, delete the old object if replacing
```

Never trust step 3 blindly: the browser can lie, S3 (`HeadObject`) is the source of truth.

## Large files: multipart

For anything over ~100 MB (videos, songs), use **S3 multipart upload** with presigned part URLs:

| Step                              | Who     | Returns                                                  |
| --------------------------------- | ------- | -------------------------------------------------------- |
| `CreateMultipartUpload`           | API     | `UploadId` (no expiry, lives until completed or aborted) |
| `UploadPart` (presigned per part) | Browser | `ETag` header per part                                   |
| `ListParts`                       | API     | which parts are done, used for **resume**                |
| `CompleteMultipartUpload`         | API     | the final object now exists                              |
| `AbortMultipartUpload`            | API     | deletes the uploaded parts                               |

- Parts are ≥ 5 MB (except the last), at most 10,000. Pick a part size (e.g. 10 MB), derive the count.
- Upload 4–6 parts in parallel and retry only the failed part.
- **Resume:** localStorage maps a file fingerprint (`name + size + lastModified`) to the upload id;
  S3's `ListParts` (not localStorage) says which parts are done.
- Track the upload in the db (`key`, `s3UploadId`, `size`, `partSize`, `status`); no parts table.

## Setup checklist

- Bucket stays **private**, never public-write.
- Bucket **CORS**: allow `PUT` from the web origin, `ExposeHeaders: ["ETag"]`.
- **Lifecycle rule**: `AbortIncompleteMultipartUpload` after 1–3 days, plus cleanup of objects
  that were uploaded but never confirmed.
- Frontend: plain `axios.put(url, file)` for S3 URLs, not the shared `/api` instance
  (that one adds `baseURL` and cookies).

## Options at a glance

| Option                              | Use when                                               |
| ----------------------------------- | ------------------------------------------------------ |
| Presigned `PUT`                     | Single files, simplest                                 |
| Presigned `POST`                    | Single files where S3 itself must enforce a size range |
| Presigned multipart                 | Large files, resumable, parallel                       |
| Temporary credentials (Cognito/STS) | The browser makes many S3 calls (Amplify-style)        |
| Public-write bucket                 | Never                                                  |

## Don'ts

- Don't ship long-lived, wide tokens in frontend code (e.g. a year-long, container-wide Azure SAS
  with delete/list rights). Frontend env vars (`VITE_*`) are public too.
- Don't let the client choose the key.
- Don't save the key before S3 confirms the object exists.
