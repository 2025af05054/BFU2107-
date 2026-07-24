import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProductCandidate {
  productName: string;
  quantity: number;
  manufacturer: string;
  description: string;
  targetPrice: number;
  targetLeadTime: number;
  currency?: string;
  confidence_score?: number;
  raw_data?: {
    matched_specs?: Record<string, any>;
    estimated_price_range?: {
      min: number;
      max: number;
    };
    estimated_lead_time_days?: {
      min: number;
      max: number;
    };
    all_manufacturers?: Array<{
      name: string;
      location?: string;
      confidence?: number;
    }>;
  };
}

interface ClarifyingQuestion {
  id: string;
  text: string;
  required: boolean;
  reason: string;
}

interface SourcingResponse {
  queryId?: string;
  summary: string;
  product_candidates: ProductCandidate[];
  clarifying_questions: ClarifyingQuestion[];
  assumptions: string[];
  overall_confidence: number;
}

export default function SourcingAssistantPage() {
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [currency, setCurrency] = useState('INR');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [extractingFromDocs, setExtractingFromDocs] = useState(false);
  const [responseData, setResponseData] = useState<SourcingResponse | null>(null);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<Record<string, string>>({});
  const [showRFQDialog, setShowRFQDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const rfqTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (rfqTimerRef.current) {
        clearTimeout(rfqTimerRef.current);
      }
    };
  }, []);

  // Start timer after getting results
  const startRFQTimer = () => {
    // Clear any existing timer
    if (rfqTimerRef.current) {
      clearTimeout(rfqTimerRef.current);
    }

    // Set 15-second timer
    rfqTimerRef.current = setTimeout(() => {
      setShowRFQDialog(true);
    }, 15000); // 15 seconds
  };

  const handleCreateRFQ = () => {
    if (!responseData) return;

    // Store sourcing data with product candidates directly
    const sourcingData = {
      product_candidates: responseData.product_candidates,
      quantity,
      priority,
      currency,
      timestamp: Date.now(),
    };
    localStorage.setItem('sourcingData', JSON.stringify(sourcingData));

    // Redirect to auth or RFQ page
    if (user) {
      navigate('/rfq');
    } else {
      navigate('/auth?returnTo=/rfq&source=sourcing');
    }
  };

  const handleCancelRFQ = () => {
    setShowRFQDialog(false);
    if (rfqTimerRef.current) {
      clearTimeout(rfqTimerRef.current);
    }
  };

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const extractFromDocuments = async () => {
    if (files.length === 0) {
      toast({ title: 'Error', description: 'Please upload at least one document', variant: 'destructive' });
      return;
    }

    setExtractingFromDocs(true);
    
    try {
      const fileUrls: string[] = [];
      
      // Upload files to Supabase storage
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `sourcing/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        
        fileUrls.push(publicUrl);
      }

      // Call edge function in extraction mode
      const { data, error } = await supabase.functions.invoke('sourcing-assistant', {
        body: {
          mode: 'extract',
          fileUrls,
          fileNames: files.map(f => f.name),
        }
      });

      if (error) throw error;
      
      if (data.extracted_description) {
        setDescription(data.extracted_description);
        toast({ 
          title: 'Success', 
          description: 'Technical specifications extracted from documents!' 
        });
      } else {
        throw new Error('No description extracted');
      }
    } catch (err) {
      console.error(err);
      toast({ 
        title: 'Error', 
        description: 'Failed to extract information from documents. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setExtractingFromDocs(false);
    }
  };

  const submitQuery = async () => {
    const hasDescription = description.trim().length > 0;
    
    // If no description but files exist, extract specs first then auto-analyze
    if (!hasDescription && files.length > 0) {
      setLoading(true);
      setResponseData(null);
      
      try {
        // Step 1: Extract specs from documents
        const fileUrls: string[] = [];
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `sourcing/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
          
          fileUrls.push(publicUrl);
        }

        toast({ title: 'Extracting specifications from documents...' });

        const { data: extractData, error: extractError } = await supabase.functions.invoke('sourcing-assistant', {
          body: {
            mode: 'extract',
            fileUrls,
            fileNames: files.map(f => f.name),
          }
        });

        if (extractError) throw extractError;
        
        if (!extractData.extracted_description) {
          throw new Error('No specifications could be extracted from documents');
        }

        // Step 2: Auto-populate description
        const extractedText = extractData.extracted_description;
        setDescription(extractedText);
        
        toast({ title: 'Specifications extracted! Now analyzing for price...' });

        // Step 3: Proceed with price estimation using extracted description
        const requestBody = {
          description: extractedText,
          quantity,
          priority,
          currency,
          fileUrls,
          fileNames: files.map(f => f.name),
        };

        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('sourcing-assistant', {
          body: requestBody
        });

        if (analysisError) throw analysisError;
        setResponseData(analysisData);
        
        toast({ 
          title: 'Success', 
          description: 'Analysis complete! Review the results below.' 
        });
      } catch (err) {
        console.error('Auto-extract workflow error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to process documents';
        toast({ 
          title: 'Error', 
          description: errorMessage, 
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Standard workflow: description provided (with or without files)
    if (!hasDescription) {
      toast({ title: 'Error', description: 'Please provide a description or upload documents', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResponseData(null);
    
    try {
      const fileUrls: string[] = [];
      
      // Upload files to Supabase storage if any
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `sourcing/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
          
          fileUrls.push(publicUrl);
        }
      }

      // Call edge function with description and/or files
      const requestBody = {
        description: description.trim(),
        quantity,
        priority,
        currency,
        fileUrls: fileUrls.length > 0 ? fileUrls : undefined,
        fileNames: files.length > 0 ? files.map(f => f.name) : undefined,
      };

      const { data, error } = await supabase.functions.invoke('sourcing-assistant', {
        body: requestBody
      });

      if (error) throw error;
      setResponseData(data);
      
      toast({ 
        title: 'Success', 
        description: 'Analysis complete! Review the results below.' 
      });
      
      // Start RFQ timer
      startRFQTimer();
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process query';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const submitClarifyingAnswers = async () => {
    if (!responseData?.queryId) {
      toast({ title: 'Error', description: 'No active query to refine', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sourcing-assistant', {
        body: {
          queryId: responseData.queryId,
          answers: clarifyingAnswers,
          refine: true,
        }
      });

      if (error) throw error;
      setResponseData(data);
      setClarifyingAnswers({});
      
      toast({ title: 'Success', description: 'Response refined with your answers!' });
      
      // Restart RFQ timer after refinement
      startRFQTimer();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to refine', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Sourcing Assistant
        </h1>
        <p className="text-muted-foreground mt-2">
          Describe your sourcing needs and let AI analyze specifications, estimate prices, and suggest suppliers
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sourcing Request</CardTitle>
          <CardDescription>Provide details about the material or component you need</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Description (Optional if documents provided)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="E.g., 'Stainless steel centrifugal pump casing, 250mm inlet, flange ANSI 150, material: SS316, drawing attached'"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 100"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="INR"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Attachments (Images, PDFs, Datasheets)</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={onFilesSelected}
                multiple
                accept="image/*,.pdf"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full md:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
              
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <span className="text-sm flex-1 truncate">{f.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={extractFromDocuments} 
              disabled={loading || extractingFromDocs || files.length === 0}
              variant="secondary"
            >
              {extractingFromDocs && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Sparkles className="h-4 w-4 mr-2" />
              Extract from Documents
            </Button>
            <Button onClick={submitQuery} disabled={loading || extractingFromDocs || (!description.trim() && files.length === 0)}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Analyze with AI
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDescription('');
                setQuantity('');
                setFiles([]);
                setResponseData(null);
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>AI is analyzing your request...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && responseData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{responseData.summary}</p>
              {responseData.overall_confidence !== undefined && (
                <div className="mt-3">
                  <span className="text-xs text-muted-foreground">
                    Confidence: {Math.round(responseData.overall_confidence * 100)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {responseData.product_candidates?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Product Candidates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {responseData.product_candidates.map((product, idx) => (
                  <div key={idx} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Product Name *</Label>
                        <p className="font-medium text-sm mt-1">{product.productName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Quantity *</Label>
                        <p className="font-medium text-sm mt-1">{product.quantity}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Manufacturer</Label>
                      <p className="font-medium text-sm mt-1">{product.manufacturer}</p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className="text-sm mt-1">{product.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Target Price (optional)</Label>
                        <p className="font-medium text-sm mt-1">
                          {product.targetPrice.toLocaleString()} {product.currency || 'INR'}
                          {product.raw_data?.estimated_price_range && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (Range: {product.raw_data.estimated_price_range.min.toLocaleString()} - {product.raw_data.estimated_price_range.max.toLocaleString()})
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Target Lead Time (days)</Label>
                        <p className="font-medium text-sm mt-1">
                          {product.targetLeadTime} days
                          {product.raw_data?.estimated_lead_time_days && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (Range: {product.raw_data.estimated_lead_time_days.min}-{product.raw_data.estimated_lead_time_days.max} days)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {responseData.clarifying_questions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Clarifying Questions</CardTitle>
                <CardDescription>Answer these to refine the estimates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {responseData.clarifying_questions.map((q, idx) => (
                  <div key={idx} className="space-y-2">
                    <Label>
                      {q.text}
                      {q.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <p className="text-xs text-muted-foreground">{q.reason}</p>
                    <Input
                      placeholder="Your answer"
                      value={clarifyingAnswers[q.id] || ''}
                      onChange={(e) => setClarifyingAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  </div>
                ))}
                <Button onClick={submitClarifyingAnswers}>
                  Submit Answers & Refine
                </Button>
              </CardContent>
            </Card>
          )}

          {responseData.assumptions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assumptions Made</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {responseData.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* RFQ Popup Dialog */}
      <Dialog open={showRFQDialog} onOpenChange={setShowRFQDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create RFQ for This Item?</DialogTitle>
            <DialogDescription>
              Would you like to raise a Request for Quote based on the sourcing analysis you just received?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              We can help you create an RFQ with the analyzed specifications and supplier information. 
              This will help you get competitive quotes from verified suppliers.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelRFQ}>
              No, Thanks
            </Button>
            <Button onClick={handleCreateRFQ}>
              Yes, Create RFQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
