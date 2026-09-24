/** rc `uid.js` 行为等价物：会话内自增的唯一 id。 */
const now = Date.now();
let index = 0;

export default function uid(): string {
  index += 1;
  return `rc-upload-${now}-${index}`;
}
