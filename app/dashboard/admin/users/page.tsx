'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserRole, UserRole } from '@/lib/hooks/useUserRole';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Users, Shield } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  role: UserRole;
}

export default function UserManagementPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, roleLoading]);

  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      
      // Use RPC function to get user data (this handles admin check internally)
      const { data: userData, error: userError } = await supabase.rpc('get_all_users_with_roles');
      
      if (userError) throw userError;
      setUsers(userData || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'editor': return 'secondary';
      case 'contributor': return 'outline';
      default: return 'default';
    }
  };

  if (roleLoading || loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-6">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Users className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
            <div>Email</div>
            <div>Role</div>
            <div>Joined</div>
            <div>Actions</div>
          </div>

          {users.map(user => (
            <div key={user.id} className="grid grid-cols-4 gap-4 items-center py-2">
              <div className="font-medium">{user.email}</div>
              <div>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString()}
              </div>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change Role
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem 
                      onClick={() => updateUserRole(user.id, 'user')}
                      disabled={user.role === 'user'}
                    >
                      User
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updateUserRole(user.id, 'contributor')}
                      disabled={user.role === 'contributor'}
                    >
                      Contributor
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updateUserRole(user.id, 'editor')}
                      disabled={user.role === 'editor'}
                    >
                      Editor
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updateUserRole(user.id, 'admin')}
                      disabled={user.role === 'admin'}
                    >
                      Admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}