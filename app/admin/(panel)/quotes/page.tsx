import { store } from "@/lib/server/store";
import QuotesManager from "@/components/admin/QuotesManager";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminQuotes() {
  // Most likely failure: the quotes table hasn't been created in Supabase yet.
  const result = await store.listQuotes().then(
    (quotes) => ({ quotes, error: null }),
    (err: Error) => ({ quotes: null, error: err.message })
  );
  if (result.quotes) return <QuotesManager quotes={result.quotes} />;
  return (
    <>
      <PageHeader title="Bulk quotes" sub="Quote requests from the contact page." />
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-900">
        <p className="font-semibold">Quotes can&apos;t be loaded yet.</p>
        <p className="mt-1">
          Run <code className="font-mono">supabase/quotes.sql</code> in the Supabase SQL editor, then reload this page.
        </p>
        <p className="mt-2 text-xs opacity-70">{result.error}</p>
      </div>
    </>
  );
}
