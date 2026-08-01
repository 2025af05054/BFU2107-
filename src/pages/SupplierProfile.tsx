import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Building2, Phone, MapPin, FileText, Edit, Save, Upload, IdCard } from "lucide-react";

interface SupplierProfile {
  id: string;
  company_name: string;
  contact_info: {
    phone?: string;
    address?: string;
    gst?: string;
    categories?: string[];
    description?: string;
  };
  created_at: string;
}

interface SupplierProfileData {
  id: string;
  company_name: string;
  contact_info: any; // JSON type from database
  created_at: string;
}

interface UserProfile {
  name: string;
  avatar_url: string;
}

const SupplierProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching supplier profile:', error);
        return;
      }

      if (data) {
        // Safely convert contact_info from JSON to typed object
        const contactInfo = (typeof data.contact_info === 'object' && data.contact_info !== null) 
          ? data.contact_info as any 
          : {};
        
        const typedProfile: SupplierProfile = {
          ...data,
          contact_info: contactInfo
        };
        setProfile(typedProfile);
      } else {
        // Create default supplier profile
        const { data: newSupplier, error: createError } = await supabase
          .from('suppliers')
          .insert({
            id: user.id,
            company_name: 'Company Name Required',
            contact_info: {}
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating supplier profile:', createError);
        } else {
          const contactInfo = (typeof newSupplier.contact_info === 'object' && newSupplier.contact_info !== null) 
            ? newSupplier.contact_info as any 
            : {};
            
          const typedProfile: SupplierProfile = {
            ...newSupplier,
            contact_info: contactInfo
          };
          setProfile(typedProfile);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          company_name: profile.company_name,
          contact_info: profile.contact_info
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file (JPG, PNG or GIF).");
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image is too large. Max size is 2MB.");
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUserProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    if (!profile) return;

    if (field === 'company_name') {
      setProfile({ ...profile, company_name: value });
    } else {
      setProfile({
        ...profile,
        contact_info: { ...profile.contact_info, [field]: value }
      });
    }
  };

  const getSupplierIdFromDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const userId = user?.id.substring(0, 8) || '00000000';
    return `SUP${year}${month}${day}${userId.toUpperCase()}`;
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Supplier Profile</h1>
              <p className="text-muted-foreground mt-2">Manage your supplier information</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Supplier ID */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="w-5 h-5 text-primary" />
                Supplier ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {getSupplierIdFromDate(profile.created_at)}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Your unique supplier identification number
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Photo */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userProfile?.avatar_url} alt="Profile" />
                  <AvatarFallback className="text-lg">
                    {userProfile?.name?.charAt(0) || profile.company_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" disabled={uploading} asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Uploading..." : "Change Photo"}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={profile.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gst">GST Number</Label>
                  <Input
                    id="gst"
                    value={profile.contact_info.gst || ''}
                    onChange={(e) => updateField('gst', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="categories">Product Categories</Label>
                <Input
                  id="categories"
                  value={profile.contact_info.categories?.join(', ') || ''}
                  onChange={(e) => updateField('categories', e.target.value.split(',').map(cat => cat.trim()))}
                  disabled={!isEditing}
                  placeholder="Electronics, Textiles, Manufacturing, etc."
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Separate categories with commas
                </p>
              </div>

              <div>
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={profile.contact_info.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Describe your business, specializations, and capabilities..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input
                    id="phone"
                    value={profile.contact_info.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Contact Person</Label>
                  <Input
                    id="name"
                    value={userProfile?.name || ''}
                    disabled
                    className="mt-1 bg-muted"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Update this in your main profile settings
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={profile.contact_info.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Enter your complete business address..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories Display */}
          {profile.contact_info.categories && profile.contact_info.categories.length > 0 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Specializations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.contact_info.categories.map((category, index) => (
                    <Badge key={index} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierProfile;