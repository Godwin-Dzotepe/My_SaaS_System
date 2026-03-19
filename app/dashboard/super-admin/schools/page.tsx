'use client';

import * as React from 'react';
import Link from 'next/link';
import { ActionMenu } from '@/components/ui/action-menu';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Phone,
  Users,
  GraduationCap,
  Plus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SUPER_ADMIN_SIDEBAR_ITEMS } from '@/lib/sidebar-configs';
import { motion } from 'framer-motion';



export default function ManageSchools() {
  const [schools, setSchools] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/super-admin/schools');
      
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

      if (data.schools) {
        setSchools(data.schools);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSchools();
  }, []);

  const handleDeleteSchool = async (schoolId: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete school');
      }
      
      await fetchSchools();

    } catch (error) {
      console.error('Error deleting school:', error);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.school_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={SUPER_ADMIN_SIDEBAR_ITEMS} userRole="super-admin" userName="System Administrator" />
      
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registered Schools</h1>
            <p className="text-gray-600">Total schools registered: {schools.length}</p>
          </div>
          <Link href="/dashboard/super-admin/schools/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add New School
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools by name..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((school) => (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-blue-600">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <ActionMenu
                        entityId={school.id}
                        editPath="/dashboard/super-admin/schools"
                        onDelete={handleDeleteSchool}
                        actions={[]}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{school.school_name}</h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin className="w-4 h-4" />
                        {school.address}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Phone className="w-4 h-4" />
                        {school.phone}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-t pt-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Students</p>
                        <div className="flex items-center justify-center gap-1 font-semibold text-blue-600">
                          <Users className="w-3 h-3" />
                          {school._count.students}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Classes</p>
                        <div className="flex items-center justify-center gap-1 font-semibold text-purple-600">
                          <GraduationCap className="w-3 h-3" />
                          {school._count.classes}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Staff</p>
                        <div className="flex items-center justify-center gap-1 font-semibold text-orange-600">
                          <Users className="w-3 h-3" />
                          {school._count.users}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
