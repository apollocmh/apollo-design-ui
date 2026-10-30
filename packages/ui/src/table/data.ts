/** A dynamic tree field is the external data boundary; descendants keep the row type. */
export function getChildren<RecordType extends object>(
  record: RecordType,
  field: string,
): RecordType[] | undefined {
  const children: unknown = Reflect.get(record, field);
  return Array.isArray(children) ? (children as RecordType[]) : undefined;
}
