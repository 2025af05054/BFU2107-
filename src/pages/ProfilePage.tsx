import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Building, Phone, MapPin, Mail, Link, CreditCard, Camera, Save, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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

  const handleSave = async () => {
    if (!user) return;

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">User Profile</h1>
          <p className="text-muted-foreground">Manage your personal and business information</p>
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