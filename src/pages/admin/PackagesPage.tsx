import React, { useEffect, useState } from 'react';
import { PlusIcon, EditIcon, ToggleLeftIcon, ToggleRightIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { mockPackages, licenseCategories, addPackage, updatePackage } from '../../utils/mockData';
import type { Package } from '../../types';
import { toast } from '../../hooks/useToast';
export function PackagesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const activePackages = mockPackages.filter(p => p.status === 'active');
  const inactivePackages = mockPackages.filter(p => p.status === 'inactive');
  const handleToggleStatus = (pkg: Package) => {
    updatePackage(pkg.id, {
      status: pkg.status === 'active' ? 'inactive' : 'active'
    });
    setRefreshKey(prev => prev + 1);
    toast('success', `Package ${pkg.status === 'active' ? 'deactivated' : 'activated'} successfully`);
  };
  return <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-500 mt-1">
            Manage service packages and pricing.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
          Add Package
        </Button>
      </div>

      {/* Active Packages */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Packages
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePackages.map(pkg => <PackageCard key={pkg.id} package={pkg} onEdit={() => setEditingPackage(pkg)} onToggleStatus={() => handleToggleStatus(pkg)} />)}
          {activePackages.length === 0 && <Card className="col-span-full">
              <p className="text-center text-gray-500 py-8">
                No active packages
              </p>
            </Card>}
        </div>
      </div>

      {/* Inactive Packages */}
      {inactivePackages.length > 0 && <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inactive Packages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inactivePackages.map(pkg => <PackageCard key={pkg.id} package={pkg} onEdit={() => setEditingPackage(pkg)} />)}
          </div>
        </div>}

      {/* Add/Edit Modal */}
      <PackageModal isOpen={showAddModal || !!editingPackage} onClose={() => {
      setShowAddModal(false);
      setEditingPackage(null);
    }} package={editingPackage} onSuccess={() => {
      setRefreshKey(prev => prev + 1);
      toast('success', editingPackage ? 'Package updated successfully' : 'Package created successfully');
      setShowAddModal(false);
      setEditingPackage(null);
    }} />
    </div>;
}
type PackageCardProps = {
  package: Package;
  onEdit: () => void;
  onToggleStatus: () => void;
};
function PackageCard({
  package: pkg,
  onEdit,
  onToggleStatus
}: PackageCardProps) {
  return <Card className={pkg.status === 'inactive' ? 'opacity-60' : ''}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <Badge variant="info" size="sm">
            {pkg.category}
          </Badge>
          <h3 className="text-lg font-semibold text-gray-900 mt-2">
            {pkg.name}
          </h3>
        </div>
        <StatusBadge status={pkg.status} />
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-500">Price</span>
          <span className="font-semibold text-gray-900">${pkg.price}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Hours</span>
          <span className="font-semibold text-gray-900">
            {pkg.numberOfHours}h
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Per Hour</span>
          <span className="font-semibold text-gray-900">
            ${(pkg.price / pkg.numberOfHours).toFixed(2)}
          </span>
        </div>
      </div>

      {pkg.description && <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>}

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <Button variant="outline" size="sm" fullWidth onClick={onEdit} icon={<EditIcon className="w-4 h-4" />}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" fullWidth onClick={onToggleStatus} icon={pkg.status === 'active' ? <ToggleRightIcon className="w-4 h-4" /> : <ToggleLeftIcon className="w-4 h-4" />}>
          {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>;
}
type PackageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  package: Package | null;
  onSuccess: () => void;
};
function PackageModal({
  isOpen,
  onClose,
  package: pkg,
  onSuccess
}: PackageModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    numberOfHours: '',
    price: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name,
        category: pkg.category,
        numberOfHours: pkg.numberOfHours.toString(),
        price: pkg.price.toString(),
        description: pkg.description || '',
        status: pkg.status
      });
    } else {
      setFormData({
        name: '',
        category: '',
        numberOfHours: '',
        price: '',
        description: '',
        status: 'active'
      });
    }
  }, [pkg]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const packageData = {
        name: formData.name,
        category: formData.category,
        numberOfHours: parseInt(formData.numberOfHours),
        price: parseFloat(formData.price),
        description: formData.description,
        status: formData.status
      };
      if (pkg) {
        updatePackage(pkg.id, packageData);
      } else {
        addPackage(packageData);
      }
      onSuccess();
    } catch (error) {
      toast('error', 'Failed to save package');
    } finally {
      setLoading(false);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={pkg ? 'Edit Package' : 'Add New Package'} description={pkg ? 'Update the package details.' : 'Create a new service package.'} size="md" footer={<div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {pkg ? 'Save Changes' : 'Create Package'}
          </Button>
        </div>}>
      <form className="space-y-6">
        <Input label="Package Name" required value={formData.name} onChange={e => setFormData({
        ...formData,
        name: e.target.value
      })} placeholder="e.g., Basic Package" />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" required value={formData.category} onChange={e => setFormData({
          ...formData,
          category: e.target.value
        })} options={licenseCategories.map(cat => ({
          value: cat,
          label: `Category ${cat}`
        }))} />
          <Input label="Number of Hours" type="number" required value={formData.numberOfHours} onChange={e => setFormData({
          ...formData,
          numberOfHours: e.target.value
        })} placeholder="e.g., 20" />
        </div>

        <Input label="Price ($)" type="number" required value={formData.price} onChange={e => setFormData({
        ...formData,
        price: e.target.value
      })} placeholder="e.g., 800" />

        <TextArea label="Description" value={formData.description} onChange={e => setFormData({
        ...formData,
        description: e.target.value
      })} placeholder="Optional description of what's included..." rows={3} />
      </form>
    </Modal>;
}