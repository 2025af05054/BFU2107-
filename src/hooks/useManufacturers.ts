import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ManufacturerListItem {
  vendorId: string;
  slug: string;
  companyName: string;
  state: string;
  cluster: string;
  fullAddress: string | null;
  website: string | null;
  capabilityTags: string[];
  exportReadiness: string | null;
  dataConfidence: number | null;
  riskLevel: string | null;
}

export interface ManufacturerProfile extends ManufacturerListItem {
  contactNo: string | null;
  phoneType: string | null;
  contactPerson: string | null;
  email: string | null;
  companySize: string | null;
  yearEstablished: string | null;
  installedCapacity: string | null;
  materialsProcesses: string | null;
  productsServed: string | null;
  capacity: string | null;
  certificationsDetail: string | null;
  exportExperience: string | null;
  exportReadinessBasis: string | null;
  verificationChecklist: string | null;
  sources: string | null;
  notes: string | null;
  productCategory: string;
}

export function useManufacturers() {
  return useQuery({
    queryKey: ["manufacturers"],
    queryFn: async (): Promise<ManufacturerListItem[]> => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select(
          `
          vendor_id, slug, capability_tags, export_readiness, data_confidence, risk_level,
          vendors:vendor_id ( company_name, state, cluster, full_address, website )
        `
        )
        .eq("is_public", true);

      if (error) throw error;

      return (data || [])
        .filter((row: any) => row.vendors)
        .map((row: any) => ({
          vendorId: row.vendor_id,
          slug: row.slug,
          companyName: row.vendors.company_name,
          state: row.vendors.state,
          cluster: row.vendors.cluster,
          fullAddress: row.vendors.full_address,
          website: row.vendors.website,
          capabilityTags: row.capability_tags || [],
          exportReadiness: row.export_readiness,
          dataConfidence: row.data_confidence,
          riskLevel: row.risk_level,
        }));
    },
  });
}

export function useManufacturerProfile(slug: string | undefined) {
  return useQuery({
    queryKey: ["manufacturer-profile", slug],
    enabled: !!slug,
    queryFn: async (): Promise<ManufacturerProfile | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select(
          `
          vendor_id, slug, materials_processes, products_served, capacity, certifications_detail,
          export_experience, export_readiness, export_readiness_basis, capability_tags,
          data_confidence, risk_level, verification_checklist, sources, notes,
          vendors:vendor_id ( company_name, state, cluster, full_address, website, contact_no, phone_type, contact_person, email, company_size, year_established, installed_capacity, product_category )
        `
        )
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();

      if (error) throw error;
      if (!data || !data.vendors) return null;
      const v: any = data.vendors;

      return {
        vendorId: data.vendor_id,
        slug: data.slug,
        companyName: v.company_name,
        state: v.state,
        cluster: v.cluster,
        fullAddress: v.full_address,
        website: v.website,
        capabilityTags: data.capability_tags || [],
        exportReadiness: data.export_readiness,
        dataConfidence: data.data_confidence,
        riskLevel: data.risk_level,
        contactNo: v.contact_no,
        phoneType: v.phone_type,
        contactPerson: v.contact_person,
        email: v.email,
        companySize: v.company_size,
        yearEstablished: v.year_established,
        installedCapacity: v.installed_capacity,
        materialsProcesses: data.materials_processes,
        productsServed: data.products_served,
        capacity: data.capacity,
        certificationsDetail: data.certifications_detail,
        exportExperience: data.export_experience,
        exportReadinessBasis: data.export_readiness_basis,
        verificationChecklist: data.verification_checklist,
        sources: data.sources,
        notes: data.notes,
        productCategory: v.product_category,
      };
    },
  });
}
