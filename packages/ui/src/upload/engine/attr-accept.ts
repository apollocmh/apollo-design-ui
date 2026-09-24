/**
 * rc `attr-accept.js` 行为等价物 —— accept 过滤。
 *
 * 四种匹配：星号全通过；`.jpg` 后缀（jpg/jpeg 双后缀）；`image/星号` 主类型；
 * 全匹配 MIME。裸词（如 `audio`）非法但放行并告警（rc 同判）。
 */

import { warning } from '@apollo-design/utils';

export default function attrAccept(
  file: File,
  acceptedFiles: string | string[] | undefined,
): boolean {
  if (file && acceptedFiles) {
    const acceptedFilesArray = Array.isArray(acceptedFiles)
      ? acceptedFiles
      : acceptedFiles.split(',');
    const fileName = file.name || '';
    const mimeType = file.type || '';
    const baseMimeType = mimeType.replace(/\/.*$/, '');

    return acceptedFilesArray.some((type) => {
      const validType = type.trim();
      // This is something like */*,*  allow all files
      if (/^\*(\/\*)?$/.test(type)) {
        return true;
      }

      // like .jpg, .png
      if (validType.charAt(0) === '.') {
        const lowerFileName = fileName.toLowerCase();
        const lowerType = validType.toLowerCase();
        let affixList = [lowerType];
        if (lowerType === '.jpg' || lowerType === '.jpeg') {
          affixList = ['.jpg', '.jpeg'];
        }
        return affixList.some((affix) => lowerFileName.endsWith(affix));
      }

      // This is something like a image/* mime type
      if (/\/\*$/.test(validType)) {
        return baseMimeType === validType.replace(/\/.*$/, '');
      }

      // Full match
      if (mimeType === validType) {
        return true;
      }

      // Invalidate type should skip
      if (/^\w+$/.test(validType)) {
        warning(false, `Upload takes an invalidate 'accept' type '${validType}'.Skip for check.`);
        return true;
      }
      return false;
    });
  }
  return true;
}
