import { useParams, Link } from "react-router-dom";
import {
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  Calendar,
  Factory,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useManufacturerProfile } from "@/hooks/useManufacturers";

const NA = (v: string | null | undefined) =>
  !v || v.trim() === "" || v.toLowerCase().startsWith("not found") || v.toLowerCase().startsWith("not confirmed");

const riskMeta: Record<string, { label: string; className: string; icon: JSX.Element }> = {
  LOW: {
    label: "Data looks reliable — standard pre-RFQ check recommended",
    className: "bg-success/10 text-success border-success/20",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  MEDIUM: {
    label: "Thin public data — verify core facts by phone before RFQ",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  HIGH: {
    label: "Identity/ambiguity risk — verify this is the right company before any RFQ",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
};

const readinessMeta: Record<string, string> = {
  "Strong EU Candidate": "bg-primary/10 text-primary border-primary/20",
  "Possible EU Candidate - Verify": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Unconfirmed - Verify Before EU RFQ": "bg-muted text-muted-foreground",
};

const ManufacturerProfilePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: m, isLoading, error } = useManufacturerProfile(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading report card...</p>
        </div>
      </div>
    );
  }

  if (error || !m) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Manufacturer Not Found</h3>
            <p className="text-muted-foreground mb-4">This profile doesn't exist or isn't published.</p>
            <Button asChild variant="outline">
              <Link to="/manufacturers">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Manufacturers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const risk = riskMeta[m.riskLevel || ""] || riskMeta.MEDIUM;
  const sourcesList = (m.sources || "")
    .split(/[,;]| ; /)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/manufacturers">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Manufacturers
        </Link>
      </Button>

      {/* Header */}
      <Card className="mb-6 shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex gap-4 items-start">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground flex-shrink-0">
                {m.companyName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">{m.companyName}</h1>
                <p className="text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="w-4 h-4" /> {m.cluster}, {m.state}
                </p>
                <div className="flex flex-wrap gap-2">
                  {m.capabilityTags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Badge variant="outline" className={readinessMeta[m.exportReadiness || ""] || "bg-muted"}>
              {m.exportReadiness}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Risk / confidence banner */}
      <Card className={`mb-6 border ${risk.className}`}>
        <CardContent className="pt-6 flex items-start gap-3">
          {risk.icon}
          <div className="flex-1">
            <p className="font-medium">{risk.label}</p>
            {typeof m.dataConfidence === "number" && (
              <div className="mt-3 max-w-sm">
                <div className="flex justify-between text-xs mb-1">
                  <span>Data confidence</span>
                  <span>{m.dataConfidence}%</span>
                </div>
                <Progress value={m.dataConfidence} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="export">Export & Compliance</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Factory className="w-4 h-4" /> Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Full Address" value={m.fullAddress} />
              <Row label="Year Established" value={m.yearEstablished} />
              <Row label="Company Size" value={m.companySize} />
              <Row label="Product Category" value={m.productCategory} />
            </CardContent>
          </Card>

          {!NA(m.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Notes & Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">{m.notes}</CardContent>
            </Card>
          )}

          {!NA(m.verificationChecklist) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Verification Checklist Before RFQ
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {m.verificationChecklist}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Materials & Processes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              {NA(m.materialsProcesses) ? "Not found — verify directly." : m.materialsProcesses}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Products & Industries Served</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              {NA(m.productsServed) ? "Not found — verify directly." : m.productsServed}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Capacity</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              {NA(m.capacity) ? "Not found — verify directly." : m.capacity}
              {!NA(m.installedCapacity) && m.installedCapacity !== m.capacity && (
                <p className="mt-2">Installed capacity (as imported): {m.installedCapacity}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certifications</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              {NA(m.certificationsDetail) ? "Not found — verify directly." : m.certificationsDetail}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Experience</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              {NA(m.exportExperience) ? "Not found — verify directly." : m.exportExperience}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Readiness Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline" className={readinessMeta[m.exportReadiness || ""] || "bg-muted"}>
                {m.exportReadiness}
              </Badge>
              <p className="text-sm text-muted-foreground leading-relaxed">{m.exportReadinessBasis}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{NA(m.contactNo) ? "Not found — verify directly" : m.contactNo}</span>
                {!NA(m.phoneType) && (
                  <Badge variant="outline" className="text-xs">
                    {m.phoneType}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{NA(m.email) ? "Not found — verify directly" : m.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                {NA(m.website) ? (
                  <span>Not found — verify directly</span>
                ) : (
                  <a
                    href={m.website.startsWith("http") ? m.website : `https://${m.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {m.website} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{NA(m.contactPerson) ? "Not found — verify directly" : m.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{NA(m.fullAddress) ? "Not found — verify directly" : m.fullAddress}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {sourcesList.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">Research Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              {sourcesList.map((s, i) => (
                <li key={i} className="break-all">
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />
      <p className="text-xs text-muted-foreground text-center">
        Profile compiled from public sources (company websites, trade directories, company registries).
        Fields marked "Not found — verify directly" were not located and were never fabricated. Always
        confirm capability, certifications, and contact details directly before issuing an RFQ.
      </p>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium">{NA(value) ? "Not found — verify directly" : value}</span>
  </div>
);

export default ManufacturerProfilePage;
