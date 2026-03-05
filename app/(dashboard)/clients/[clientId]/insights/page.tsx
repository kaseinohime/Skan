import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { InsightsDashboardClient } from "./insights-dashboard-client";

export const dynamic = "force-dynamic";

export default async function InsightsDashboardPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId } = await params;
  const supabase = await createClient();

  const [{ data: client, error }, { data: accountSettings }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("id", clientId).single(),
    supabase
      .from("client_account_settings")
      .select("kpi_save_rate_target, kpi_home_rate_target")
      .eq("client_id", clientId)
      .maybeSingle(),
  ]);

  if (error || !client) notFound();

  return (
    <div className="container mx-auto max-w-6xl p-8">
      <InsightsDashboardClient
        clientId={clientId}
        clientName={client.name}
        kpiSaveRateTarget={accountSettings?.kpi_save_rate_target ?? 0.02}
        kpiHomeRateTarget={accountSettings?.kpi_home_rate_target ?? 0.40}
      />
    </div>
  );
}
