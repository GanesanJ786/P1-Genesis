/**
 * Detect a "column does not exist" PostgREST/Postgres error so writes can
 * retry without newly-migrated columns. Shared by admin actions and the live
 * webhook — keeps the site functional when code deploys before SQL.
 */
export function isMissingColumnError(error: {
  code?: string;
  message?: string;
}): boolean {
  if (error.code === "PGRST204" || error.code === "42703") return true;
  const m = error.message ?? "";
  return /could not find .* column|column .* does not exist|schema cache/i.test(m);
}
