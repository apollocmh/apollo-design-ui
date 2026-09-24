/**
 * rc `traverseFileTree.js` 行为等价物 —— directory 模式递归读取。
 *
 * issue 16426：目录内文件的 webkitRelativePath 用 entry.fullPath 回填
 * （去掉前导斜杠）。
 */

type FileSystemEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  fullPath?: string;
  file: (cb: (file: File) => void) => void;
  createReader: () => {
    readEntries: (cb: (entries: FileSystemEntryLike[]) => void, err?: () => void) => void;
  };
};

const traverseFileTree = async (
  files: DataTransferItem[],
  isAccepted: (file: File) => boolean,
): Promise<File[]> => {
  const flattenFileList: File[] = [];
  const progressFileList: (FileSystemEntryLike | null)[] = [];
  for (const file of files) {
    progressFileList.push(file.webkitGetAsEntry() as unknown as FileSystemEntryLike);
  }

  async function readDirectory(directory: FileSystemEntryLike): Promise<FileSystemEntryLike[]> {
    const dirReader = directory.createReader();
    const entries: FileSystemEntryLike[] = [];
    for (;;) {
      const results = await new Promise<FileSystemEntryLike[]>((resolve) => {
        dirReader.readEntries(resolve, () => resolve([]));
      });
      const n = results.length;
      if (!n) {
        break;
      }
      for (let i = 0; i < n; i++) {
        entries.push(results[i] as FileSystemEntryLike);
      }
    }
    return entries;
  }

  async function readFile(item: FileSystemEntryLike): Promise<File | null> {
    return new Promise((resolve) => {
      item.file((file) => {
        if (isAccepted(file)) {
          // https://github.com/ant-design/ant-design/issues/16426
          if (item.fullPath && !file.webkitRelativePath) {
            // webkitRelativePath 在 File 上只读 —— 用 defineProperty 覆写（rc 同法）
            Object.defineProperty(file, 'webkitRelativePath', {
              value: item.fullPath.replace(/^\//, ''),
              writable: true,
              configurable: true,
            });
          }
          resolve(file);
        } else {
          resolve(null);
        }
      });
    });
  }

  const traverseItem = async (item: FileSystemEntryLike | null): Promise<void> => {
    if (!item) {
      return;
    }
    if (item.isFile) {
      const file = await readFile(item);
      if (file) {
        flattenFileList.push(file);
      }
    } else if (item.isDirectory) {
      const entries = await readDirectory(item);
      progressFileList.push(...entries);
    }
  };

  let wipIndex = 0;
  while (wipIndex < progressFileList.length) {
    await traverseItem(progressFileList[wipIndex] ?? null);
    wipIndex++;
  }
  return flattenFileList;
};

export default traverseFileTree;
