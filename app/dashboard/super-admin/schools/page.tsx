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
  Plus,
  Power,
  PowerOff
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
  
  const [deactivateModalOpen, setDeactivateModalOpen] = React.useState(false);
  const [selectedSchool, setSelectedSchool] = React.useState<any>(null);
  const [deactivationMessage, setDeactivationMessage] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

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

  const handleToggleStatus = async (school: any, newStatus: boolean) => {
    if (!newStatus) {
      setSelectedSchool(school);
      setDeactivateModalOpen(true);
      return;
    }
    
    // Activate flow
    setIsUpdating(true);
    try {
      const res = await fetch("/api/super-admin/schools/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: school.id, isActive: true })
      });
      if (res.ok) {
        alert("School activated successfully.");
        fetchSchools();
      } else {
        const errorData = await res.json().catch(() => null); alert(`Failed to activate school. ${errorData?.error || ""} ${errorData?.details || ""}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!selectedSchool) return;
    if (!deactivationMessage.trim()) {
      alert("Please provide a reason for deactivation.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/super-admin/schools/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          schoolId: selectedSchool.id, 
          isActive: false, 
          deactivationMessage 
        })
      });
      if (res.ok) {
        alert("School deactivated successfully.");
        setDeactivateModalOpen(false);
        setDeactivationMessage('');
        fetchSchools();
      } else {
        const errorData = await res.json().catch(() => null); alert(`Failed to deactivate school. ${errorData?.error || ""} ${errorData?.details || ""}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
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
                <Card className={`hover:shadow-lg transition-shadow border-t-4 ${school.isActive ? 'border-t-blue-600' : 'border-t-red-500 opacity-80'}`}>                                                                                 
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">     
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">                                                                                
                        <Building2 className={`w-6 h-6 ${school.isActive ? 'text-blue-600' : 'text-red-500'}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        {school.isActive ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleToggleStatus(school, false)}
                          >
                            <PowerOff className="w-4 h-4 mr-1" /> Deactivate
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleToggleStatus(school, true)}
                          >
                            <Power className="w-4 h-4 mr-1" /> Activate
                          </Button>
                        )}
                        <ActionMenu
                          entityId={school.id}
                          editPath="/dashboard/super-admin/schools"
                          onDelete={handleDeleteSchool}
                          actions={[]}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-xl font-bold text-gray-900">{school.school_name}</h3> 
                       {!school.isActive && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Inactive</span>}
                    </div>
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
                          {school._count?.students || 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Classes</p>   
                        <div className="flex items-center justify-center gap-1 font-semibold text-purple-600">                                                                            
                          <GraduationCap className="w-3 h-3" />
                          {school._count?.classes || 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Staff</p>     
                        <div className="flex items-center justify-center gap-1 font-semibold text-orange-600">                                                                            
                          <Users className="w-3 h-3" />
                          {school._count?.users || 0}
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

      {deactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Deactivate School</h3>
            <p className="text-sm text-gray-500 mb-4">
              You are about to deactivate <strong>{selectedSchool?.school_name}</strong>. Provide a reason so the school admin knows why they are blocked.
            </p>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              placeholder="e.g., Unpaid subscription, Abuse of terms..."
              value={deactivationMessage}
              onChange={(e) => setDeactivationMessage(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={() => { setDeactivateModalOpen(false); setDeactivationMessage(''); }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white" 
                onClick={confirmDeactivate}
                disabled={isUpdating || !deactivationMessage.trim()}
              >
                {isUpdating ? "Deactivating..." : "Confirm Deactivation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
