'use client';

import * as React from 'react';
import { ActionMenu } from '@/components/ui/action-menu';
import {
  ShieldCheck,
  Search,
  Users,
  BadgeCheck,
  GraduationCap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';



export default function UserManagement() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/super-admin/users');

      if (response.status === 401) {
        window.location.href = '/auth/login';
        return;
      }
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      if (data.users) {
        setUsers(data.users);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/super-admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      await fetchUsers();

    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <ShieldCheck className="w-4 h-4 text-red-600" />;
      case 'school_admin': return <BadgeCheck className="w-4 h-4 text-blue-600" />;
      case 'teacher': return <GraduationCap className="w-4 h-4 text-green-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.includes(searchQuery)
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super-admin" userName="System Administrator" />
      
      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Total system users: {users.length}</p>
          </div>
        </div>

        <Card className="bg-white">
          <CardContent className="p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email or phone..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-4 font-medium text-gray-600">User</th>
                    <th className="px-6 py-4 font-medium text-gray-600">Role</th>
                    <th className="px-6 py-4 font-medium text-gray-600">School</th>
                    <th className="px-6 py-4 font-medium text-gray-600">Contact</th>
                    <th className="px-6 py-4 font-medium text-gray-600">Joined</th>
                    <th className="px-6 py-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{user.school?.school_name || 'System (N/A)'}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <ActionMenu
                          entityId={user.id}
                          editPath="/dashboard/super-admin/users"
                          onDelete={handleDeleteUser}
                          actions={[]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
