import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Building, Phone, MapPin, Mail, Link, CreditCard, Camera, Save, Edit3, IdCard, Tags, AtSign, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  name?: string;
  company?: string;
  gst?: string;
  mobile?: string;
  address?: string;
  avatar_url?: string;
  company_url?: string;
  bank_account?: string;
}

interface SupplierInfo {
  created_at: string;
  categories: string[];
  description: string;
  username: string | null;
  bio: string | null;
}

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

const getSupplierId = (userId: string, createdAt: string) => {
  const date = new Date(createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `SUP${year}${month}${day}${userId.substring(0, 8).toUpperCase()}`;
};

// Single profile form shared by the User Dashboard and Supplier Dashboard.
// Personal/business fields (name, mobile, gst, address, company) live in
// `profiles` and are entered once here regardless of which dashboard the
// user opens. Supplier-only fields (categories, description) are shown and
// saved to `suppliers` only when the logged-in user has the supplier role.
const ProfilePage = () => {
  const { user } = useAuth();
  const { isSupplier } = useUserRole();
  const [profile, setProfile] = useState<UserProfile>({});
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");

  useEffect(() => {
    if (user) {
      fetchProfile();
      if (isSupplier()) {
        fetchSupplierInfo();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSupplier()]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setProfile(data);
    }
  };

  const fetchSupplierInfo = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('suppliers')
      .select('created_at, contact_info, username, bio')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching supplier info:', error);
      return;
    }

    if (data) {
      const contactInfo = (typeof data.contact_info === 'object' && data.contact_info !== null)
        ? data.contact_info as any
        : {};
      setSupplierInfo({
        created_at: data.created_at,
        categories: contactInfo.categories || [],
        description: contactInfo.description || '',
        username: data.username,
        bio: data.bio,
      });
      setUsernameInput(data.username || '');
    } else {
      // No supplier row yet (e.g. role assigned but never opened supplier dashboard) - create one.
      // company_name is NOT NULL in the DB but may not be known yet, so we
      // use an empty string as a placeholder-free sentinel; the supplier is
      // then required to set a real name before the row appears publicly
      // (see the empty-name filter in SuppliersPage / SupplierProfilePage).
      const { data: newSupplier, error: createError } = await supabase
        .from('suppliers')
        .insert({ id: user.id, company_name: profile.company || '', contact_info: {} })
        .select('created_at, contact_info')
        .single();

      if (!createError && newSupplier) {
        setSupplierInfo({ created_at: newSupplier.created_at, categories: [], description: '', username: null, bio: null });
      }
    }
  };

  // Debounced availability check while the supplier is editing their handle.
  useEffect(() => {
    if (!isEditing || !isSupplier()) return;
    const trimmed = usernameInput.trim().toLowerCase();

    if (!trimmed) {
      setUsernameStatus("idle");
      return;
    }
    if (trimmed === supplierInfo?.username) {
      setUsernameStatus("available");
      return;
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timeout = setTimeout(async () => {
      const { data, error } = await supabase.rpc('is_supplier_username_available', { p_username: trimmed });
      if (error) {
        console.error('Error checking username availability:', error);
        setUsernameStatus("idle");
        return;
      }
      setUsernameStatus(data ? "available" : "taken");
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameInput, isEditing]);

  const handleSave = async () => {
    if (!user) return;

    if (isSupplier() && supplierInfo && !profile.company?.trim()) {
      toast.error("Company name is required for supplier profiles");
      return;
    }

    const trimmedUsername = usernameInput.trim().toLowerCase();
    if (isSupplier() && supplierInfo && trimmedUsername) {
      if (!USERNAME_REGEX.test(trimmedUsername)) {
        toast.error("Portfolio ID must be 3-30 characters: lowercase letters, numbers, underscores");
        return;
      }
      if (usernameStatus === "taken") {
        toast.error("This portfolio ID is already taken");
        return;
      }
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      if (isSupplier() && supplierInfo) {
        const { error: supplierError } = await supabase
          .from('suppliers')
          .update({
            company_name: profile.company.trim(),
            contact_info: {
              categories: supplierInfo.categories,
              description: supplierInfo.description
            },
            username: trimmedUsername || null,
            bio: supplierInfo.bio?.trim() || null,
          })
          .eq('id', user.id);

        if (supplierError) {
          if (supplierError.code === '23505') {
            toast.error("This portfolio ID is already taken");
            setIsSaving(false);
            return;
          }
          throw supplierError;
        }
      }

      if (isSupplier() && supplierInfo) {
        setSupplierInfo(prev => prev ? { ...prev, username: trimmedUsername || null } : prev);
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar uploaded successfully!");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const updateField = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const updateSupplierField = (field: 'description' | 'categories', value: string) => {
    setSupplierInfo(prev => {
      if (!prev) return prev;
      if (field === 'categories') {
        return { ...prev, categories: value.split(',').map(c => c.trim()).filter(Boolean) };
      }
      return { ...prev, description: value };
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">
            {isSupplier()
              ? "Manage your personal, business, and supplier information — used across your Supplier and User dashboards"
              : "Manage your personal and business information"}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Save className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {isSupplier() && supplierInfo && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="w-5 h-5" />
                Supplier ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {getSupplierId(user!.id, supplierInfo.created_at)}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Your unique supplier identification number
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isSupplier() && supplierInfo && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AtSign className="w-5 h-5" />
                Public Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Portfolio ID</Label>
                <div className="flex items-center">
                  <AtSign className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                  <Input
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-muted' : ''}
                    placeholder="e.g. rayban_traders"
                  />
                </div>
                {isEditing && usernameInput.trim() && (
                  <p className={`text-sm mt-1 ${
                    usernameStatus === 'available' ? 'text-success' :
                    usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-destructive' :
                    'text-muted-foreground'
                  }`}>
                    {usernameStatus === 'checking' && 'Checking availability...'}
                    {usernameStatus === 'available' && 'Available'}
                    {usernameStatus === 'taken' && 'Already taken'}
                    {usernameStatus === 'invalid' && 'Use 3-30 lowercase letters, numbers, or underscores'}
                  </p>
                )}
                {!isEditing && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Share this link with customers so they can view your product portfolio without an account.
                  </p>
                )}
              </div>

              <div>
                <Label>Portfolio Bio</Label>
                <Textarea
                  value={supplierInfo.bio || ''}
                  onChange={(e) => setSupplierInfo(prev => prev ? { ...prev, bio: e.target.value } : prev)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                  placeholder="A short intro shown on your public portfolio page"
                  rows={2}
                />
              </div>

              {supplierInfo.username && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {window.location.origin}/s/{supplierInfo.username}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/s/${supplierInfo.username}`);
                      toast.success("Link copied!");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={`/s/${supplierInfo.username}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile Photo Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url} alt="Profile picture" />
                <AvatarFallback className="text-lg">
                  {profile.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Camera className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                    Change Photo
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={profile.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div>
                <Label>Mobile Number</Label>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    value={profile.mobile || ''}
                    onChange={(e) => updateField('mobile', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-muted' : ''}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>
              <div>
                <Label>GST Number</Label>
                <Input
                  value={profile.gst || ''}
                  onChange={(e) => updateField('gst', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                  placeholder="Enter GST number"
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground mt-3" />
                <Textarea
                  value={profile.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Company/Shop Name</Label>
                <Input
                  value={profile.company || ''}
                  onChange={(e) => updateField('company', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label>Company Website</Label>
                <div className="flex items-center">
                  <Link className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    value={profile.company_url || ''}
                    onChange={(e) => updateField('company_url', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-muted' : ''}
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isSupplier() && supplierInfo && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="w-5 h-5" />
                Supplier Catalog Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Product Categories</Label>
                <Input
                  value={supplierInfo.categories.join(', ')}
                  onChange={(e) => updateSupplierField('categories', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                  placeholder="Electronics, Textiles, Manufacturing, etc."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Separate categories with commas
                </p>
              </div>
              <div>
                <Label>Business Description</Label>
                <Textarea
                  value={supplierInfo.description}
                  onChange={(e) => updateSupplierField('description', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                  rows={4}
                  placeholder="Describe your business, specializations, and capabilities..."
                />
              </div>
              {supplierInfo.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {supplierInfo.categories.map((category, index) => (
                    <Badge key={index} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Financial Information */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Bank Account Details</Label>
              <div className="flex items-start">
                <CreditCard className="w-4 h-4 mr-2 text-muted-foreground mt-3" />
                <Textarea
                  value={profile.bank_account || ''}
                  onChange={(e) => updateField('bank_account', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                  placeholder="Bank Name, Account Number, IFSC Code, etc."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
