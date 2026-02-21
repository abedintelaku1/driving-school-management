import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, AlertTriangleIcon, DownloadIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FilterBar } from '../../components/ui/FilterBar';
import { useLanguage } from '../../hooks/useLanguage';
import type { Car } from '../../types';
import { toast } from '../../hooks/useToast';
import { api } from '../../utils/api';
import jsPDF from 'jspdf';

export function CarsPage() {
  const { t, language } = useLanguage();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [deletingCar, setDeletingCar] = useState<Car | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [transmissionFilter, setTransmissionFilter] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  // Fetch cars from API
  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const { ok, data } = await api.listCars();
        if (ok && data) {
          // Transform MongoDB data to frontend format
          const mapped = (data as any[]).map((item) => ({
            id: item._id || item.id,
            model: item.model || '',
            yearOfManufacture: item.yearOfManufacture || 0,
            chassisNumber: item.chassisNumber || '',
            transmission: item.transmission || 'manual',
            fuelType: item.fuelType || 'petrol',
            licensePlate: item.licensePlate || '',
            ownership: item.ownership || 'owned',
            instructorId: item.instructorId || null,
            registrationExpiry: item.registrationExpiry
              ? new Date(item.registrationExpiry).toISOString().split('T')[0]
              : '',
            lastInspection: item.lastInspection
              ? new Date(item.lastInspection).toISOString().split('T')[0]
              : '',
            nextInspection: item.nextInspection
              ? new Date(item.nextInspection).toISOString().split('T')[0]
              : '',
            totalHours: item.totalHours || 0,
            status: item.status || 'active',
            createdAt: item.createdAt
              ? new Date(item.createdAt).toISOString().split('T')[0]
              : '',
            updatedAt: item.updatedAt
              ? new Date(item.updatedAt).toISOString().split('T')[0]
              : '',
          }));
          setCars(mapped as Car[]);
        } else {
          toast('error', t('cars.failedToLoad'));
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
        toast('error', t('cars.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [refreshKey]);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      if (statusFilter && car.status !== statusFilter) return false;
      if (transmissionFilter && car.transmission !== transmissionFilter) return false;
      return true;
    });
  }, [cars, statusFilter, transmissionFilter]);

  const clearFilters = () => {
    setStatusFilter("");
    setTransmissionFilter("");
  };

  const hasActiveFilters = !!(statusFilter || transmissionFilter);

  const getDaysUntilInspection = (date: string) => {
    const inspection = new Date(date);
    const today = new Date();
    return Math.ceil((inspection.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleExport = () => {
    if (!filteredCars.length) {
      toast('info', t('cars.noCarsToExport'));
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    if (exportFormat === 'csv') {
      const headers = [
        t('cars.modelColumn'),
        t('cars.yearColumn'),
        t('cars.licensePlateColumn'),
        t('cars.transmissionColumn'),
        t('cars.fuelColumn'),
        t('cars.ownershipColumn'),
        t('cars.totalHoursColumn'),
        t('cars.statusColumn'),
        t('cars.registrationExpiryColumn'),
        t('cars.lastInspectionColumn'),
        t('cars.nextInspectionColumn')
      ];
      const rows = filteredCars.map(car => [
        car.model || '',
        car.yearOfManufacture?.toString() || '',
        car.licensePlate || '',
        car.transmission === 'manual' ? t('cars.manual') : t('cars.automatic'),
        car.fuelType === 'petrol' ? t('cars.petrol') : car.fuelType === 'diesel' ? t('cars.diesel') : car.fuelType === 'electric' ? t('cars.electric') : car.fuelType === 'hybrid' ? t('cars.hybrid') : car.fuelType || '',
        car.ownership === 'owned' ? t('cars.owned') : t('cars.rented'),
        car.totalHours?.toString() || '0',
        car.status === 'active' ? t('common.active') : t('common.inactive'),
        car.registrationExpiry || '',
        car.lastInspection || '',
        car.nextInspection || ''
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t('cars.csvFilename')}_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast('success', t('cars.exportedToCSV'));
    } else {
      // PDF Export
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(t('cars.title'), 14, 20);
      doc.setFontSize(10);
      const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
      const locale = localeMap[language] || 'sq-AL';
      doc.text(`${t('reports.exportDate')}: ${new Date().toLocaleDateString(locale)}`, 14, 30);
      doc.text(`${t('common.total')}: ${filteredCars.length} ${t('cars.title').toLowerCase()}`, 14, 37);
      
      let yPos = 50;
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(t('cars.modelColumn'), 14, yPos);
      doc.text(t('cars.yearColumn'), 50, yPos);
      doc.text(t('cars.licensePlateColumn'), 65, yPos);
      doc.text(t('cars.transmissionColumn').substring(0, 8), 90, yPos);
      doc.text(t('cars.fuelColumn').substring(0, 10), 110, yPos);
      doc.text(t('cars.totalHoursColumn').substring(0, 5), 145, yPos);
      doc.text(t('cars.statusColumn'), 165, yPos);
      
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      filteredCars.forEach((car) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        const transmission = car.transmission === 'manual' ? t('cars.manual') : t('cars.automatic');
        const fuelType = car.fuelType === 'petrol' ? t('cars.petrol') : car.fuelType === 'diesel' ? t('cars.diesel') : car.fuelType === 'electric' ? t('cars.electric') : car.fuelType === 'hybrid' ? t('cars.hybrid') : car.fuelType || '';
        const status = car.status === 'active' ? t('common.active') : t('common.inactive');
        
        doc.text((car.model || '').substring(0, 18), 14, yPos);
        doc.text(car.yearOfManufacture?.toString() || '', 50, yPos);
        doc.text((car.licensePlate || '').substring(0, 10), 65, yPos);
        doc.text(transmission.substring(0, 8), 90, yPos);
        doc.text(fuelType.substring(0, 12), 110, yPos);
        doc.text((car.totalHours || 0).toString(), 145, yPos);
        doc.text(status, 165, yPos);
        yPos += 6;
      });
      
      doc.save(`${t('cars.csvFilename')}_${timestamp}.pdf`);
      toast('success', t('cars.exportedToPDF'));
    }
  };

  const handleDelete = async (car: Car) => {
    setDeletingCar(car);
  };

  const confirmDelete = async () => {
    if (!deletingCar) return;

    try {
      const { ok, data } = await api.deleteCar(deletingCar.id);
      if (ok) {
        toast('success', t('cars.carDeleted'));
        setRefreshKey((prev) => prev + 1);
        setDeletingCar(null);
      } else {
        toast('error', (data as any)?.message || t('cars.failedToDelete'));
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      toast('error', t('cars.failedToDelete'));
    }
  };

  const columns = [
    {
      key: 'model',
      label: t('cars.vehicleColumn'),
      sortable: true,
      render: (_: unknown, car: Car) => (
        <div>
          <p className="font-medium text-gray-900">{car.model}</p>
          <p className="text-sm text-gray-500">{car.yearOfManufacture}</p>
        </div>
      ),
    },
    {
      key: 'licensePlate',
      label: t('cars.licensePlateColumn'),
      sortable: true,
      render: (value: unknown) => (
        <span className="font-mono text-gray-900">{value as string}</span>
      ),
    },
    {
      key: 'transmission',
      label: t('cars.transmissionColumn'),
      render: (value: unknown) => {
        const transmission = value as string;
        const translated = transmission === 'manual' ? t('cars.manual') : t('cars.automatic');
        return (
          <Badge variant="outline">
            {translated}
          </Badge>
        );
      },
    },
    {
      key: 'fuelType',
      label: t('cars.fuelColumn'),
      render: (value: unknown) => (
        <span className="text-gray-700 capitalize">{value as string}</span>
      ),
    },
    {
      key: 'totalHours',
      label: t('cars.totalHoursColumn'),
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">{value as number}h</span>
      ),
    },
    {
      key: 'nextInspection',
      label: t('cars.nextInspectionColumn'),
      sortable: true,
      render: (value: unknown) => {
        const days = getDaysUntilInspection(value as string);
        const isUrgent = days <= 30;
        return (
          <div className="flex items-center gap-2">
            {isUrgent && <AlertTriangleIcon className="w-4 h-4 text-amber-500" />}
            <span className={isUrgent ? 'text-amber-600 font-medium' : 'text-gray-700'}>
              {value as string}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: t('cars.statusColumn'),
      sortable: true,
      render: (value: unknown) => <StatusBadge status={value as 'active' | 'inactive'} />,
    },
  ];

  const actions = (car: Car) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditingCar(car)}
        icon={<EditIcon className="w-4 h-4" />}
      >
        {t('common.edit')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDelete(car)}
        icon={<TrashIcon className="w-4 h-4" />}
      >
        {t('common.delete')}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('cars.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('cars.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2 items-center">
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
              options={[
                { value: 'csv', label: t('reports.csv') },
                { value: 'pdf', label: t('reports.pdf') },
              ]}
              placeholder={t('common.selectOption')}
              className="w-24"
            />
            <Button 
              variant="outline" 
              onClick={handleExport} 
              icon={<DownloadIcon className="w-4 h-4" />}
              disabled={filteredCars.length === 0}
            >
              {exportFormat === 'csv' ? t('cars.exportCSV') : t('cars.exportPDF')}
            </Button>
          </div>
          <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
            {t('cars.addCar')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <div className="w-full sm:w-48">
          <Select
            placeholder={t('cars.allStatuses')}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: t('cars.allStatuses') },
              { value: 'active', label: t('common.active') },
              { value: 'inactive', label: t('common.inactive') },
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            placeholder={t('cars.allTransmissions')}
            value={transmissionFilter}
            onChange={(e) => setTransmissionFilter(e.target.value)}
            options={[
              { value: '', label: t('cars.allTransmissions') },
              { value: 'manual', label: t('cars.manual') },
              { value: 'automatic', label: t('cars.automatic') },
            ]}
          />
        </div>
      </FilterBar>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredCars}
          columns={columns}
          keyExtractor={(car) => car.id}
          searchable
          searchPlaceholder={t('cars.searchPlaceholder')}
          searchKeys={['model', 'licensePlate', 'chassisNumber']}
          actions={actions}
          emptyMessage={t('cars.noCarsFound')}
        />
      </Card>

      {/* Add/Edit Modal */}
      <AddCarModal
        isOpen={showAddModal || !!editingCar}
        onClose={() => {
          setShowAddModal(false);
          setEditingCar(null);
        }}
        car={editingCar}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          toast('success', editingCar ? t('cars.carUpdated') : t('cars.carAdded'));
          setShowAddModal(false);
          setEditingCar(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingCar && (
        <Modal
          isOpen={!!deletingCar}
          onClose={() => setDeletingCar(null)}
          title={t('cars.deleteCar')}
          description={t('cars.confirmDelete')}
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeletingCar(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                {t('common.delete')}
              </Button>
            </div>
          }
        />
      )}
    </div>
  );
}

type AddCarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  car?: Car | null;
  onSuccess: () => void;
};

function AddCarModal({ isOpen, onClose, car, onSuccess }: AddCarModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    model: '',
    yearOfManufacture: '',
    chassisNumber: '',
    transmission: '',
    fuelType: '',
    licensePlate: '',
    ownership: 'owned',
    instructorId: '',
    registrationExpiry: '',
    lastInspection: '',
    nextInspection: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);

  // Fetch instructors when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchInstructors = async () => {
        try {
          const { ok, data } = await api.listInstructors();
          if (ok && data) {
            const opts = (data as any[]).map((ins: any) => ({
              id: ins._id || ins.id,
              name: `${ins.user?.firstName || ''} ${ins.user?.lastName || ''}`.trim() || ins.user?.email || t('common.roleInstructor')
            }));
            setInstructors(opts);
          }
        } catch (err) {
          console.error('Failed to load instructors:', err);
        }
      };
      fetchInstructors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (car) {
      setFormData({
        model: car.model,
        yearOfManufacture: car.yearOfManufacture.toString(),
        chassisNumber: car.chassisNumber,
        transmission: car.transmission,
        fuelType: car.fuelType,
        licensePlate: car.licensePlate,
        ownership: car.instructorId ? 'instructor' : (car.ownership || 'owned'),
        instructorId: car.instructorId || '',
        registrationExpiry: car.registrationExpiry,
        lastInspection: car.lastInspection,
        nextInspection: car.nextInspection,
        status: car.status,
      });
    } else {
      setFormData({
        model: '',
        yearOfManufacture: '',
        chassisNumber: '',
        transmission: '',
        fuelType: '',
        licensePlate: '',
        ownership: 'owned',
        instructorId: '',
        registrationExpiry: '',
        lastInspection: '',
        nextInspection: '',
        status: 'active',
      });
    }
  }, [car]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const carData: any = {
        model: formData.model.trim(),
        yearOfManufacture: parseInt(formData.yearOfManufacture),
        chassisNumber: formData.chassisNumber.trim(),
        transmission: formData.transmission as 'manual' | 'automatic',
        fuelType: formData.fuelType as 'petrol' | 'diesel' | 'electric' | 'hybrid',
        licensePlate: formData.licensePlate.trim(),
        ownership: formData.ownership as 'owned' | 'instructor',
        registrationExpiry: formData.registrationExpiry,
        lastInspection: formData.lastInspection,
        nextInspection: formData.nextInspection,
        status: formData.status,
      };

      // If ownership is instructor, add instructorId
      if (formData.ownership === 'instructor' && formData.instructorId) {
        carData.instructorId = formData.instructorId;
      }

      if (car) {
        // Update existing car
        const { ok, data } = await api.updateCar(car.id, carData);
        if (ok) {
          onSuccess();
        } else {
          toast('error', (data as any)?.message || t('cars.carUpdateFailed'));
        }
      } else {
        // Create new car
        const { ok, data } = await api.createCar(carData);
        if (ok) {
          onSuccess();
        } else {
          toast('error', (data as any)?.message || t('cars.carCreateFailed'));
        }
      }
    } catch (error) {
      console.error('Error saving car:', error);
      toast('error', t('cars.carSaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={car ? t('cars.editCarTitle') : t('cars.addCarTitle')}
      description={t('cars.enterCarDetails')}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {car ? t('common.saveChanges') : t('cars.addCar')}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('cars.model')}
            required
            value={formData.model}
            onChange={(e) =>
              setFormData({
                ...formData,
                model: e.target.value,
              })
            }
            placeholder={t('cars.modelPlaceholder')}
          />
          <Input
            label={t('cars.yearOfManufacture')}
            type="number"
            required
            value={formData.yearOfManufacture}
            onChange={(e) =>
              setFormData({
                ...formData,
                yearOfManufacture: e.target.value,
              })
            }
            placeholder={t('cars.yearPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('cars.chassisNumber')}
            required
            value={formData.chassisNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                chassisNumber: e.target.value,
              })
            }
          />
          <Input
            label={t('cars.licensePlate')}
            required
            value={formData.licensePlate}
            onChange={(e) =>
              setFormData({
                ...formData,
                licensePlate: e.target.value,
              })
            }
            placeholder={t('cars.licensePlatePlaceholder')}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label={t('cars.transmission')}
            required
            value={formData.transmission}
            onChange={(e) =>
              setFormData({
                ...formData,
                transmission: e.target.value,
              })
            }
            options={[
              { value: 'manual', label: t('cars.manual') },
              { value: 'automatic', label: t('cars.automatic') },
            ]}
          />
          <Select
            label={t('cars.fuelType')}
            required
            value={formData.fuelType}
            onChange={(e) =>
              setFormData({
                ...formData,
                fuelType: e.target.value,
              })
            }
            options={[
              { value: 'petrol', label: t('cars.petrol') },
              { value: 'diesel', label: t('cars.diesel') },
              { value: 'electric', label: t('cars.electric') },
              { value: 'hybrid', label: t('cars.hybrid') },
            ]}
          />
          {car ? (
            // Edit mode: show ownership based on car type (disabled)
            <Input
              label={t('cars.ownership')}
              value={car.instructorId ? t('cars.instructor') : t('cars.school')}
              disabled
              hint={car.instructorId ? t('cars.instructorCarHint') : t('cars.schoolCarHint')}
            />
          ) : (
            // Add mode: owned and instructor options
            <Select
              label={t('cars.ownership')}
              required
              value={formData.ownership}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ownership: e.target.value,
                  instructorId: e.target.value !== 'instructor' ? '' : formData.instructorId,
                })
              }
              options={[
                { value: 'owned', label: t('cars.school') },
                { value: 'instructor', label: t('cars.instructor') },
              ]}
            />
          )}
        </div>

        {/* Instructor field - only show when ownership is instructor */}
        {formData.ownership === 'instructor' && (
          <Select
            label={t('common.instructor')}
            required={formData.ownership === 'instructor'}
            value={formData.instructorId}
            onChange={(e) =>
              setFormData({
                ...formData,
                instructorId: e.target.value,
              })
            }
            options={[
              { value: '', label: t('cars.selectInstructor') },
              ...instructors.map((instructor) => ({
                value: instructor.id,
                label: instructor.name,
              })),
            ]}
          />
        )}

        <div className="grid grid-cols-3 gap-4">
          <Input
            label={t('cars.registrationExpiry')}
            type="date"
            required
            value={formData.registrationExpiry}
            onChange={(e) =>
              setFormData({
                ...formData,
                registrationExpiry: e.target.value,
              })
            }
          />
          <Input
            label={t('cars.lastInspection')}
            type="date"
            required
            value={formData.lastInspection}
            onChange={(e) =>
              setFormData({
                ...formData,
                lastInspection: e.target.value,
              })
            }
          />
          <Input
            label={t('cars.nextInspection')}
            type="date"
            required
            value={formData.nextInspection}
            onChange={(e) =>
              setFormData({
                ...formData,
                nextInspection: e.target.value,
              })
            }
          />
        </div>

        {car && (
          <Select
            label={t('cars.status')}
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as 'active' | 'inactive',
              })
            }
            options={[
              { value: 'active', label: t('common.active') },
              { value: 'inactive', label: t('common.inactive') },
            ]}
          />
        )}
      </form>
    </Modal>
  );
}
