import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, Package, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCastingsCatalog, CastingProduct } from "@/hooks/useCastingsCatalog";
import { useRFQCart } from "@/contexts/RFQCartContext";

const readinessBadgeClass = (readiness: string | null) => {
  if (readiness === "Strong EU Candidate") return "bg-primary/10 text-primary border-primary/20";
  if (readiness === "Possible EU Candidate - Verify") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-muted text-muted-foreground";
};

const riskBadgeClass = (risk: string | null) => {
  if (risk === "LOW") return "bg-success/10 text-success border-success/20";
  if (risk === "HIGH") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-amber-500/10 text-amber-600 border-amber-500/20";
};

const CastingsPage = () => {
  const { data, isLoading, error } = useCastingsCatalog();
  const { addUnidentifiedProduct } = useRFQCart();
  const [search, setSearch] = useState("");
  const [material, setMaterial] = useState("all");
  const [process, setProcess] = useState("all");
  const [cluster, setCluster] = useState("all");
  const [selected, setSelected] = useState<CastingProduct | null>(null);

  const products = data || [];

  const materials = useMemo(
    () => Array.from(new Set(products.map((p) => p.materialTag).filter(Boolean))).sort() as string[],
    [products]
  );
  const processes = useMemo(
    () => Array.from(new Set(products.map((p) => p.processTag).filter(Boolean))).sort() as string[],
    [products]
  );
  const clusters = useMemo(
    () => Array.from(new Set(products.map((p) => `${p.state} - ${p.cluster}`))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.companyName.toLowerCase().includes(search.toLowerCase());
      const matchesMaterial = material === "all" || p.materialTag === material;
      const matchesProcess = process === "all" || p.processTag === process;
      const matchesCluster = cluster === "all" || `${p.state} - ${p.cluster}` === cluster;
      return matchesSearch && matchesMaterial && matchesProcess && matchesCluster;
    });
  }, [products, search, material, process, cluster]);

  const handleRequestQuote = (p: CastingProduct) => {
    addUnidentifiedProduct({
      name: p.name,
      description: `${p.materialTag || "Casting"}${p.processTag ? ` — ${p.processTag}` : ""}. Sourced from ${p.companyName} (${p.cluster}, ${p.state}). ${p.sourceNote}`,
      manufacturer: p.companyName,
      quantity: 1,
    });
    setSelected(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading castings catalog...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Catalog</h3>
            <p className="text-muted-foreground">Failed to load the castings catalog. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Castings Catalog</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Real capability offerings sourced directly from verified casting manufacturers across India —
          browse by material or process, then request a quote. These are custom-manufactured components,
          so pricing depends on your drawing, spec, and quantity — not a fixed catalog price.
        </p>
      </div>

      <Card className="mb-6 shadow-card">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products or manufacturer..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger>
              <SelectValue placeholder="All materials" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All materials</SelectItem>
              {materials.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={process} onValueChange={setProcess}>
            <SelectTrigger>
              <SelectValue placeholder="All processes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All processes</SelectItem>
              {processes.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length} offering{filtered.length === 1 ? "" : "s"} from{" "}
        {new Set(filtered.map((p) => p.vendorId)).size} manufacturer
        {new Set(filtered.map((p) => p.vendorId)).size === 1 ? "" : "s"}
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <Card
            key={p.id}
            className="shadow-card hover:shadow-button transition-spring cursor-pointer"
            onClick={() => setSelected(p)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base leading-snug">{p.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {p.companyName} — {p.cluster}, {p.state}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {p.materialTag && (
                  <Badge variant="secondary" className="text-xs">
                    {p.materialTag}
                  </Badge>
                )}
                {p.processTag && (
                  <Badge variant="outline" className="text-xs">
                    {p.processTag}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className={riskBadgeClass(p.riskLevel)}>
                  {p.riskLevel === "LOW" ? (
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    "Verify Before Order"
                  )}
                </Badge>
                {typeof p.dataConfidence === "number" && (
                  <span className="text-muted-foreground">{p.dataConfidence}% data confidence</span>
                )}
              </div>
              <Button
                variant="default"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestQuote(p);
                }}
              >
                Request Quote
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selected.materialTag && <Badge variant="secondary">{selected.materialTag}</Badge>}
                  {selected.processTag && <Badge variant="outline">{selected.processTag}</Badge>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Manufacturer</p>
                  <p className="font-medium">{selected.companyName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.cluster}, {selected.state}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={readinessBadgeClass(selected.exportReadiness)}>
                    {selected.exportReadiness}
                  </Badge>
                  <Badge variant="outline" className={riskBadgeClass(selected.riskLevel)}>
                    {selected.riskLevel} risk
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{selected.sourceNote}</p>
                <p className="text-sm font-medium">Pricing: quote-based — depends on drawing, spec, and quantity.</p>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => handleRequestQuote(selected)}>Request Quote</Button>
                  <Button variant="outline" asChild>
                    <Link to={`/manufacturers/${selected.vendorSlug}`}>
                      View Full Manufacturer Profile <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CastingsPage;
