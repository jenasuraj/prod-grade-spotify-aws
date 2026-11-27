import { useEffect, useMemo } from 'react';

// A temporary blob: url to preview a local file; released when the file changes or the page closes
export const useObjectUrl = (file?: File | null) => {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return url;
};
