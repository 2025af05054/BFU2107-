import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, ArrowRight, Loader2, Factory, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useManufacturers } from "@/hooks/useManufacturers";

const riskBadgeClass = (risk: string | null) => {
  switch (risk) {
    case "LOW":
      return "bg-success/10 text-success border-success/20";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "HIGH":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const readinessBadgeClass = (readiness: string | null) => {
  if (readiness === "Strong EU Candidate") return "bg-primary/10 text-primary border-primary/20";
  if (readiness === "Possible EU Candidate - Verify") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-muted text-muted-foreground";
};

const ManufacturersPage = () => {
  const { data, isLoading, error } = useManufacturers();
  const [search, setSearch] = useState("");
  const [cluster, setCluster] = useState<string>("all");
  const [material, setMaterial] = useState<string>("all");

  const manufacturers = data || [];

  const clusters = useMemo(() => {
    const set = new Set(manufacturers.map((m) => `${m.state} - ${m.cluster}`));
    return Array.from(set).sort();
  }, [manufacturers]);

  const materials = useMemo(() => {
    const set = new Set(manufacturers.flatMap((m) => m.capabilityTags));
    return Array.from(set).sort();
  }, [manufacturers]);

  const filtered = useMemo(() => {
    return manufacturers.filter((m) => {
      const matchesSearch =
        !search ||
        m.companyName.toLowerCase().includes(search.toLowerCase()) ||
        m.cluster.toLowerCase().includes(search.toLowerCase()) ||
        m.state.toLowerCase().includes(search.toLowerCase());
      const matchesCluster = cluster === "all" || `${m.state} - ${m.cluster}` === cluster;
      const matchesMaterial = material === "all" || m.capabilityTags.includes(material);
      return matchesSearch && matchesCluster && matchesMaterial;
    });
  }, [manufacturers, search, cluster, material]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading verified manufacturers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Manufacturers</h3>
            <p className="text-muted-foreground">Failed to load manufacturer profiles. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Factory className="w-6 h-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Verified Manufacturers</h1>
        </div>
        <p className="text-muted-foreground">
          Researched casting manufacturer profiles across India's major foundry clusters — materials,
          capacity, certifications, and export readiness, so you know exactly who you're sourcing from.
        </p>
      </div>

      <Card className="mb-6 shadow-card">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by company or cluster..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={cluster} onValueChange={setCluster}>
            <SelectTrigger>
              <SelectValue placeholder="All clusters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clusters</SelectItem>
              {clusters.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger>
              <SelectValue placeholder="All capabilities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All capabilities</SelectItem>
              {materials.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-8">
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary mb-1">{manufacturers.length}</div>
            <div className="text-muted-foreground text-sm">Manufacturers</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-1">{clusters.length}</div>
            <div className="text-muted-foreground text-sm">Clusters</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-success mb-1">
              {manufacturers.filter((m) => m.exportReadiness === "Strong EU Candidate").length}
            </div>
            <div className="text-muted-foreground text-sm">Strong EU Candidates</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-destructive mb-1">
              {manufacturers.filter((m) => m.riskLevel === "HIGH").length}
            </div>
            <div className="text-muted-foreground text-sm">Needs Verification</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((m) => (
          <Card key={m.vendorId} className="shadow-card hover:shadow-button transition-spring group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-3">
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                  {m.companyName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={riskBadgeClass(m.riskLevel)}>
                    {m.riskLevel === "LOW" ? (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified Data
                      </span>
                    ) : m.riskLevel === "HIGH" ? (
                      "Verify Before RFQ"
                    ) : (
                      "Partial Data"
                    )}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {m.companyName}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {m.cluster}, {m.state}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {m.capabilityTags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {m.capabilityTags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{m.capabilityTags.length - 3} more
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className={readinessBadgeClass(m.exportReadiness)}>
                  {m.exportReadiness}
                </Badge>
                {typeof m.dataConfidence === "number" && (
                  <span className="text-muted-foreground">Data confidence: {m.dataConfidence}%</span>
                )}
              </div>

              <Button variant="default" className="w-full" asChild>
                <Link to={`/manufacturers/${m.slug}`}>
                  View Report Card
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <Factory className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Manufacturers Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManufacturersPage;
