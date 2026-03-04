/**
 * Module-level singleton for passing a File across client-side navigations.
 * Used by the /edit page to hand off an uploaded file to the homepage.
 */

let pendingFile: File | null = null;

export function setPendingUpload(file: File) {
  pendingFile = file;
}

export function consumePendingUpload(): File | null {
  const f = pendingFile;
  pendingFile = null;
  return f;
}
