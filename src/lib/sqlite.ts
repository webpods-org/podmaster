export function generateInsertStatement(
  table: string,
  row: Record<string, unknown>
) {
  const keys = Object.getOwnPropertyNames(row);
  const columns = keys.map((x) => `"${x}"`).join(", ");
  const values = keys.map((x) => `@${x}`).join(", ");
  return `INSERT INTO "${table}" (${columns}) VALUES (${values})`;
}

export function generateUpdateStatement(
  table: string,
  row: Record<string, unknown>,
  clauses?: string
) {
  const keys = Object.getOwnPropertyNames(row);
  const setters = keys.map((key) => `"${key}"=${`@${key}`}`).join(", ");
  return clauses
    ? `UPDATE "${table}" SET ${setters} ${clauses}`
    : `UPDATE "${table}" SET ${setters}`;
}
