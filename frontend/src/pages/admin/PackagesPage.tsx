import React, { useEffect, useState } from 'react';
import { PlusIcon, EditIcon, ToggleLeftIcon, ToggleRightIcon, TrashIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { useLanguage } from '../../hooks/useLanguage';
import type { Package } from '../../types';
import { toast } from '../../hooks/useToast';
import { api } from '../../utils/api';
export function PackagesPage() {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [deletingPackage, setDeletingPackage] = useState<Package | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const { ok, data } = await api.listPackages();
        if (ok && data) {
          const mapped = (data as any[]).map(item => ({
            id: item._id || item.id,
            name: item.name,
            category: item.category,
            numberOfHours: item.numberOfHours,
            price: item.price,
            description: item.description || '',
            status: item.status || 'active',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString()
          }));
          setPackages(mapped as Package[]);
        }
      } catch (error) {
        console.error('Failed to load packages:', error);
        toast('error', t('packages.failedToLoadPackages'));
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [refreshKey]);

  const activePackages = packages.filter(p => p.status === 'active');
  const inactivePackages = packages.filter(p => p.status === 'inactive');

  const handleToggleStatus = async (pkg: Package) => {
    try {
      const newStatus = pkg.status === 'active' ? 'inactive' : 'active';
      const resp = await api.updatePackage(pkg.id, { status: newStatus });
      if (!resp.ok) {
        const errorMessage = (resp.data as any)?.message || t('packages.failedToUpdatePackageStatus');
        toast('error', errorMessage);
        return;
      }
        toast('success', newStatus === 'active' ? t('packages.packageUpdated') : t('packages.packageUpdated'));
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error toggling package status:', error);
      toast('error', t('common.somethingWentWrong'));
    }
  };

  const handleDelete = async () => {
    if (!deletingPackage) return;
    
    setIsDeleting(true);
    try {
      const resp = await api.deletePackage(deletingPackage.id);
      if (!resp.ok) {
        const errorMessage = (resp.data as any)?.message || t('packages.failedToDeletePackage');
        toast('error', errorMessage);
        return;
      }
        toast('success', t('packages.packageDeleted'));
      setRefreshKey(prev => prev + 1);
      setDeletingPackage(null);
    } catch (error) {
      console.error('Error deleting package:', error);
      toast('error', t('common.somethingWentWrong'));
    } finally {
      setIsDeleting(false);
    }
  };
  return <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('packages.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('packages.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
          {t('packages.addPackage')}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      ) : (
        <>
          {/* Active Packages */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('packages.activePackages')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePackages.map(pkg => <PackageCard key={pkg.id} package={pkg} onEdit={() => setEditingPackage(pkg)} onToggleStatus={() => handleToggleStatus(pkg)} onDelete={() => setDeletingPackage(pkg)} />)}
              {activePackages.length === 0 && <Card className="col-span-full">
                  <p className="text-center text-gray-500 py-8">
                    {t('packages.noActivePackages')}
                  </p>
                </Card>}
            </div>
          </div>

          {/* Inactive Packages */}
          {inactivePackages.length > 0 && <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('packages.inactivePackages')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inactivePackages.map(pkg => <PackageCard key={pkg.id} package={pkg} onEdit={() => setEditingPackage(pkg)} onToggleStatus={() => handleToggleStatus(pkg)} onDelete={() => setDeletingPackage(pkg)} />)}
              </div>
            </div>}
        </>
      )}

      {/* Add/Edit Modal */}
      <PackageModal isOpen={showAddModal || !!editingPackage} onClose={() => {
      setShowAddModal(false);
      setEditingPackage(null);
    }} package={editingPackage} onSuccess={() => {
      setRefreshKey(prev => prev + 1);
      // Toast message is already shown in handleSubmit
      setShowAddModal(false);
      setEditingPackage(null);
    }} />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingPackage}
        onClose={() => setDeletingPackage(null)}
        onConfirm={handleDelete}
        title={t('packages.deletePackage')}
        message={deletingPackage ? t('packages.confirmDelete').replace('{name}', deletingPackage.name) : ''}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        loading={isDeleting}
      />
    </div>;
}
type PackageCardProps = {
  package: Package;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
};
function PackageCard({
  package: pkg,
  onEdit,
  onToggleStatus,
  onDelete
}: PackageCardProps) {
  const { t } = useLanguage();
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
          <span className="text-gray-500">{t('packages.price')}</span>
          <span className="font-semibold text-gray-900">€{pkg.price}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">{t('packages.hours')}</span>
          <span className="font-semibold text-gray-900">
            {pkg.numberOfHours}h
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">{t('packages.perHour')}</span>
          <span className="font-semibold text-gray-900">
            €{(pkg.price / pkg.numberOfHours).toFixed(2)}
          </span>
        </div>
      </div>

      {pkg.description && <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>}

      <div className="flex gap-1 pt-4 border-t border-gray-100">
        <Button variant="outline" size="sm" className="flex-1 px-2 py-1 text-xs" onClick={onEdit} icon={<EditIcon className="w-3.5 h-3.5" />}>
          {t('common.edit')}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 px-2 py-1 text-xs" onClick={onToggleStatus} icon={pkg.status === 'active' ? <ToggleRightIcon className="w-3.5 h-3.5" /> : <ToggleLeftIcon className="w-3.5 h-3.5" />}>
          {pkg.status === 'active' ? t('packages.deactivate') : t('packages.activate')}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onDelete} 
          icon={<TrashIcon className="w-3.5 h-3.5" />}
        >
          {t('common.delete')}
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
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    numberOfHours: '',
    price: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [loading, setLoading] = useState(false);
  const [licenseCategories, setLicenseCategories] = useState<string[]>([]);

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

  useEffect(() => {
    const fetchLicenseCategories = async () => {
      try {
        const { ok, data } = await api.getLicenseCategories();
        if (ok && data) {
          setLicenseCategories(data);
        } else {
          // Fallback to default categories if API fails
          setLicenseCategories(['AM', 'A1', 'A2', 'A', 'B1', 'B', 'C1', 'C', 'D1', 'D', 'BE', 'CE', 'DE']);
        }
      } catch (error) {
        console.error('Failed to load license categories:', error);
        // Fallback to default categories if API fails
        setLicenseCategories(['AM', 'A1', 'A2', 'A', 'B1', 'B', 'C1', 'C', 'D1', 'D', 'BE', 'CE', 'DE']);
      }
    };
    if (isOpen) {
      fetchLicenseCategories();
    }
  }, [isOpen]);
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
      
      let resp;
      if (pkg) {
        resp = await api.updatePackage(pkg.id, packageData);
      } else {
        resp = await api.createPackage(packageData);
      }
      
      if (!resp.ok) {
        const errorMessage = (resp.data as any)?.message || t('packages.failedToSavePackage');
        toast('error', errorMessage);
        return;
      }
      
      toast('success', pkg ? t('packages.packageUpdated') : t('packages.packageAdded'));
      
      // Reset form if creating new package
      if (!pkg) {
        setFormData({
          name: '',
          category: '',
          numberOfHours: '',
          price: '',
          description: '',
          status: 'active'
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving package:', error);
      toast('error', t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={pkg ? t('packages.editPackage') : t('packages.addPackage')} description={pkg ? t('packages.editPackageDescription') : t('packages.addPackageDescription')} size="md" footer={<div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {pkg ? t('packages.saveChanges') : t('packages.createPackage')}
          </Button>
        </div>}>
      <form className="space-y-6">
        <Input label={t('packages.packageName')} required value={formData.name} onChange={e => setFormData({
        ...formData,
        name: e.target.value
      })} placeholder={t('packages.packageNamePlaceholder')} />

        <div className="grid grid-cols-2 gap-4">
          <Select label={t('packages.category')} required value={formData.category} onChange={e => setFormData({
          ...formData,
          category: e.target.value
        })} options={licenseCategories.map(cat => ({
          value: cat,
          label: `${t('packages.category')} ${cat}`
        }))} />
          <Input label={t('packages.numberOfHours')} type="number" required value={formData.numberOfHours} onChange={e => setFormData({
          ...formData,
          numberOfHours: e.target.value
        })} placeholder={t('packages.numberOfHoursPlaceholder')} />
        </div>

        <Input label={t('packages.priceLabel')} type="number" required value={formData.price} onChange={e => setFormData({
        ...formData,
        price: e.target.value
      })} placeholder={t('packages.pricePlaceholder')} />

        <TextArea label={t('packages.description')} value={formData.description} onChange={e => setFormData({
        ...formData,
        description: e.target.value
      })} placeholder={t('packages.descriptionPlaceholder')} rows={3} />
      </form>
    </Modal>;
}