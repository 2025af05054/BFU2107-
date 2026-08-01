import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import { RoleBasedRoute } from '@/components/RoleBasedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Shield, Settings, Trash2, Loader2, KeyRound } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  created_at: string;
}

const AdminPanel = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testOtpEmail, setTestOtpEmail] = useState('');
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [testOtpLoading, setTestOtpLoading] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      // Fetch profiles with user roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          company,
          created_at
        `);

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch emails via admin-only RPC (client cannot call the Supabase admin API directly)
      const { data: emailsData, error: emailsError } = await supabase
        .rpc('get_all_user_emails');

      if (emailsError) console.error('Error fetching user emails:', emailsError);

      // Combine the data
      const combinedData: Profile[] = profilesData?.map(profile => {
        const userRole = rolesData?.find(role => role.user_id === profile.id);
        const emailRow = emailsData?.find((row) => row.id === profile.id);

        return {
          ...profile,
          email: emailRow?.email || 'N/A',
          role: userRole?.role || 'customer'
        };
      }) || [];

      setProfiles(combinedData);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'supplier' | 'customer') => {
    if (userId === user?.id && newRole !== 'admin') {
      toast({
        title: "Action blocked",
        description: "You can't remove your own admin role.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Insert the new role first, then remove old ones, so a failed
      // insert never leaves the user with zero roles in between.
      const { error: insertError } = await supabase
        .from('user_roles')
        .upsert([{ user_id: userId, role: newRole }], { onConflict: 'user_id,role' });

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .neq('role', newRole);

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchProfiles(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Action blocked",
        description: "You can't delete your own account.",
        variant: "destructive",
      });
      return;
    }

    setDeletingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (error || (data as { error?: string } | null)?.error) {
        throw new Error((data as { error?: string } | null)?.error || error?.message);
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getTestOtp = async () => {
    if (!testOtpEmail) return;
    setTestOtpLoading(true);
    setTestOtp(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-get-test-otp', {
        body: { email: testOtpEmail },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      const result = data as { otp?: string; error?: string } | null;
      if (error || result?.error) {
        throw new Error(result?.error || error?.message);
      }

      setTestOtp(result?.otp || null);
    } catch (error) {
      console.error('Error getting test OTP:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get test OTP",
        variant: "destructive",
      });
    } finally {
      setTestOtpLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'supplier':
        return 'default';
      case 'customer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <RoleBasedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users and system settings</p>
            </div>
            <Shield className="h-8 w-8 text-primary" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profiles.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profiles.filter(p => p.role === 'supplier').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profiles.filter(p => p.role === 'customer').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test OTP (bypasses email delivery, for testing while the sending domain is unverified) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Get Test Signup OTP
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Fetches a signup verification code directly, without sending an email. Use this to test signup with any email address while domain email verification is pending.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="test@example.com"
                  value={testOtpEmail}
                  onChange={(e) => setTestOtpEmail(e.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={getTestOtp} disabled={testOtpLoading || !testOtpEmail}>
                  {testOtpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Get Code
                </Button>
              </div>
              {testOtp && (
                <p className="text-sm">
                  Code: <span className="font-mono font-bold text-lg tracking-widest">{testOtp}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <div className="space-y-4">
                  {filteredProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{profile.name || 'Unnamed User'}</h3>
                        <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                        {profile.company && (
                          <p className="text-xs text-muted-foreground truncate">{profile.company}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={getRoleBadgeVariant(profile.role)}>
                          {profile.role}
                        </Badge>

                        <Select
                          defaultValue={profile.role}
                          onValueChange={(value) => updateUserRole(profile.id, value as 'admin' | 'supplier' | 'customer')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="supplier">Supplier</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={profile.id === user?.id || deletingId === profile.id}
                            >
                              {deletingId === profile.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {profile.name || profile.email}'s account and all associated data. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteUser(profile.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  
                  {filteredProfiles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </RoleBasedRoute>
  );
};

export default AdminPanel;