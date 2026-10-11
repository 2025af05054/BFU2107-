import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CastingProduct {
  id: string;
  name: string;
  materialTag: string | null;
  processTag: string | null;
  weightRange: string | null;
  sourceNote: string;
  vendorId: string;
  vendorSlug: string;
  companyName: string;
  state: string;
  cluster: string;
  exportReadiness: string | null;
  dataConfidence: number | null;
  riskLevel: string | null;
}

export function useCastingsCatalog() {
  return useQuery({
    queryKey: ["castings-catalog"],
    queryFn: async (): Promise<CastingProduct[]> => {
      const { data, error } = await supabase
        .from("vendor_products")
        .select(
          `
          id, name, material_tag, process_tag, weight_range, source_note, vendor_id,
          vendors:vendor_id (
            state, cluster, company_name,
            vendor_profiles ( slug, export_readiness, data_confidence, risk_level, is_public )
          )
        `
        )
        .eq("is_public", true);

      if (error) throw error;

      const getProfile = (vp: any) => (Array.isArray(vp) ? vp[0] : vp);

      return (data || [])
        .filter((row: any) => row.vendors && getProfile(row.vendors.vendor_profiles)?.is_public)
        .map((row: any) => {
          const vp = getProfile(row.vendors.vendor_profiles);
          return {
            id: row.id,
            name: row.name,
            materialTag: row.material_tag,
            processTag: row.process_tag,
            weightRange: row.weight_range,
            sourceNote: row.source_note,
            vendorId: row.vendor_id,
            vendorSlug: vp.slug,
            companyName: row.vendors.company_name,
            state: row.vendors.state,
            cluster: row.vendors.cluster,
            exportReadiness: vp.export_readiness,
            dataConfidence: vp.data_confidence,
            riskLevel: vp.risk_level,
          };
        });
    },
  });
}
