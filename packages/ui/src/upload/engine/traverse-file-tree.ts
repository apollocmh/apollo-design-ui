/** Read all browser directory batches, preserving the native relative path. */
function isFileEntry(entry: FileSystemEntry): entry is FileSystemFileEntry {
  return entry.isFile;
}
function isDirectoryEntry(entry: FileSystemEntry): entry is FileSystemDirectoryEntry {
  return entry.isDirectory;
}

export default async function traverseFileTree(
  items: DataTransferItem[],
  accepted: (file: File) => boolean,
): Promise<File[]> {
  const files: File[] = [];
  const entries = items.map((item) => item.webkitGetAsEntry());
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    if (!entry) continue;
    if (isFileEntry(entry)) {
      const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
      if (accepted(file)) {
        if (entry.fullPath && !file.webkitRelativePath) {
          Object.defineProperty(file, 'webkitRelativePath', {
            value: entry.fullPath.replace(/^\//, ''),
            configurable: true,
          });
        }
        files.push(file);
      }
    } else if (isDirectoryEntry(entry)) {
      const reader = entry.createReader();
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
          reader.readEntries(resolve, reject),
        );
        if (batch.length === 0) break;
        entries.push(...batch);
      }
    }
  }
  return files;
}
