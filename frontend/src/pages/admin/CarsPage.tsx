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
import type { Car } from '../../types';
import { toast } from '../../hooks/useToast';
import { api } from '../../utils/api';
import jsPDF from 'jspdf';

export function CarsPage() {
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
          toast('error', 'Dështoi ngarkimi i makinave');
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
        toast('error', 'Dështoi ngarkimi i makinave');
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
      toast('info', 'Nuk ka makina për eksport');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    if (exportFormat === 'csv') {
      const headers = ['Modeli', 'Viti', 'Targat', 'Transmetimi', 'Lloji i karburantit', 'Pronësia', 'Orë totale', 'Statusi', 'Regjistrimi deri', 'Inspektimi i fundit', 'Inspektimi tjetër'];
      const rows = filteredCars.map(car => [
        car.model || '',
        car.yearOfManufacture?.toString() || '',
        car.licensePlate || '',
        car.transmission === 'manual' ? 'Manual' : 'Automatik',
        car.fuelType === 'petrol' ? 'Benzinë' : car.fuelType === 'diesel' ? 'Diesel' : car.fuelType === 'electric' ? 'Elektrik' : car.fuelType || '',
        car.ownership === 'owned' ? 'E pronës' : 'E marrë me qira',
        car.totalHours?.toString() || '0',
        car.status === 'active' ? 'Aktiv' : 'Jo aktiv',
        car.registrationExpiry || '',
        car.lastInspection || '',
        car.nextInspection || ''
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `makinat_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast('success', 'Makinat u eksportuan në CSV');
    } else {
      // PDF Export
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Lista e Makinave', 14, 20);
      doc.setFontSize(10);
      doc.text(`Data e eksportit: ${new Date().toLocaleDateString('sq-AL')}`, 14, 30);
      doc.text(`Total: ${filteredCars.length} makina`, 14, 37);
      
      let yPos = 50;
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Modeli', 14, yPos);
      doc.text('Viti', 50, yPos);
      doc.text('Targat', 65, yPos);
      doc.text('Trans.', 90, yPos);
      doc.text('Karburant', 110, yPos);
      doc.text('Orë', 145, yPos);
      doc.text('Statusi', 165, yPos);
      
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      filteredCars.forEach((car) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        const transmission = car.transmission === 'manual' ? 'Manual' : 'Auto';
        const fuelType = car.fuelType === 'petrol' ? 'Benzinë' : car.fuelType === 'diesel' ? 'Diesel' : car.fuelType === 'electric' ? 'Elektrik' : car.fuelType || '';
        const status = car.status === 'active' ? 'Aktiv' : 'Jo aktiv';
        
        doc.text((car.model || '').substring(0, 18), 14, yPos);
        doc.text(car.yearOfManufacture?.toString() || '', 50, yPos);
        doc.text((car.licensePlate || '').substring(0, 10), 65, yPos);
        doc.text(transmission, 90, yPos);
        doc.text(fuelType.substring(0, 12), 110, yPos);
        doc.text((car.totalHours || 0).toString(), 145, yPos);
        doc.text(status, 165, yPos);
        yPos += 6;
      });
      
      doc.save(`makinat_${timestamp}.pdf`);
      toast('success', 'Makinat u eksportuan në PDF');
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
        toast('success', 'Car deleted successfully');
        setRefreshKey((prev) => prev + 1);
        setDeletingCar(null);
      } else {
        toast('error', (data as any)?.message || 'Dështoi fshirja e makinës');
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      toast('error', 'Dështoi fshirja e makinës');
    }
  };

  const columns = [
    {
      key: 'model',
      label: 'Mjeti',
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
      label: 'Targë',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-mono text-gray-900">{value as string}</span>
      ),
    },
    {
      key: 'transmission',
      label: 'Transmisioni',
      render: (value: unknown) => (
        <Badge variant="outline">
          {(value as string).charAt(0).toUpperCase() + (value as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'fuelType',
      label: 'Karburanti',
      render: (value: unknown) => (
        <span className="text-gray-700 capitalize">{value as string}</span>
      ),
    },
    {
      key: 'totalHours',
      label: 'Orë totale',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">{value as number}h</span>
      ),
    },
    {
      key: 'nextInspection',
      label: 'Inspektimi i ardhshëm',
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
      label: 'Status',
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
        Ndrysho
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDelete(car)}
        icon={<TrashIcon className="w-4 h-4" />}
      >
        Fshi
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
          <h1 className="text-2xl font-bold text-gray-900">Makinat</h1>
          <p className="text-gray-500 mt-1">
            Menaxhoni mjetet e shkollës së makinës dhe mirëmbajtjen e tyre.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2 items-center">
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'pdf', label: 'PDF' },
              ]}
              className="w-24"
            />
            <Button 
              variant="outline" 
              onClick={handleExport} 
              icon={<DownloadIcon className="w-4 h-4" />}
              disabled={filteredCars.length === 0}
            >
              Eksporto {exportFormat.toUpperCase()}
            </Button>
          </div>
          <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
            Shto makinë
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <div className="w-full sm:w-48">
          <Select
            placeholder="Të gjitha statuset"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Të gjitha statuset' },
              { value: 'active', label: 'Aktive' },
              { value: 'inactive', label: 'Joaktive' },
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            placeholder="Të gjitha transmisionet"
            value={transmissionFilter}
            onChange={(e) => setTransmissionFilter(e.target.value)}
            options={[
              { value: '', label: 'Të gjitha transmisionet' },
              { value: 'manual', label: 'Manuale' },
              { value: 'automatic', label: 'Automatik' },
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
          searchPlaceholder="Search cars..."
          searchKeys={['model', 'licensePlate', 'chassisNumber']}
          actions={actions}
          emptyMessage="No cars found"
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
          toast('success', editingCar ? 'Makina u përditësua me sukses' : 'Makina u shtua me sukses');
          setShowAddModal(false);
          setEditingCar(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingCar && (
        <Modal
          isOpen={!!deletingCar}
          onClose={() => setDeletingCar(null)}
          title="Fshi makinën"
          description={`Jeni të sigurt që dëshironi të fshini ${deletingCar.model} (${deletingCar.licensePlate})? Ky veprim nuk mund të kthehet.`}
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeletingCar(null)}>
                Anulo
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Fshi
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
              name: `${ins.user?.firstName || ''} ${ins.user?.lastName || ''}`.trim() || ins.user?.email || 'Instructor'
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
          toast('error', (data as any)?.message || 'Dështoi përditësimi i makinës');
        }
      } else {
        // Create new car
        const { ok, data } = await api.createCar(carData);
        if (ok) {
          onSuccess();
        } else {
          toast('error', (data as any)?.message || 'Dështoi krijimi i makinës');
        }
      }
    } catch (error) {
      console.error('Error saving car:', error);
      toast('error', 'Dështoi ruajtja e makinës');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={car ? 'Ndrysho makinën' : 'Shto makinë të re'}
      description="Vendosni të dhënat e mjetit për ta regjistruar në sistem."
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Anulo
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {car ? 'Ruaj ndryshimet' : 'Shto makinë'}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Modeli"
            required
            value={formData.model}
            onChange={(e) =>
              setFormData({
                ...formData,
                model: e.target.value,
              })
            }
            placeholder="p.sh. Toyota Corolla"
          />
          <Input
            label="Viti i prodhimit"
            type="number"
            required
            value={formData.yearOfManufacture}
            onChange={(e) =>
              setFormData({
                ...formData,
                yearOfManufacture: e.target.value,
              })
            }
            placeholder="p.sh. 2022"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Numri i shasisë"
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
            label="Targë"
            required
            value={formData.licensePlate}
            onChange={(e) =>
              setFormData({
                ...formData,
                licensePlate: e.target.value,
              })
            }
            placeholder="p.sh. ABC-1234"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Transmisioni"
            required
            value={formData.transmission}
            onChange={(e) =>
              setFormData({
                ...formData,
                transmission: e.target.value,
              })
            }
            options={[
              { value: 'manual', label: 'Manuale' },
              { value: 'automatic', label: 'Automatik' },
            ]}
          />
          <Select
            label="Lloji i karburantit"
            required
            value={formData.fuelType}
            onChange={(e) =>
              setFormData({
                ...formData,
                fuelType: e.target.value,
              })
            }
            options={[
              { value: 'petrol', label: 'Benzinë' },
              { value: 'diesel', label: 'Naftë' },
              { value: 'electric', label: 'Elektrik' },
              { value: 'hybrid', label: 'Hibrid' },
            ]}
          />
          {car ? (
            // Edit mode: show ownership based on car type (disabled)
            <Input
              label="Pronësia"
              value={car.instructorId ? 'Instruktor' : 'Shkolla'}
              disabled
              hint={car.instructorId ? 'Kjo është makina personale e një instruktori' : 'Kjo është makina e shkollës'}
            />
          ) : (
            // Add mode: owned and instructor options
            <Select
              label="Pronësia"
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
                { value: 'owned', label: 'Shkolla' },
                { value: 'instructor', label: 'Instruktor' },
              ]}
            />
          )}
        </div>

        {/* Instructor field - only show when ownership is instructor */}
        {formData.ownership === 'instructor' && (
          <Select
            label="Instructor"
            required={formData.ownership === 'instructor'}
            value={formData.instructorId}
            onChange={(e) =>
              setFormData({
                ...formData,
                instructorId: e.target.value,
              })
            }
            options={[
              { value: '', label: 'Select an instructor' },
              ...instructors.map((instructor) => ({
                value: instructor.id,
                label: instructor.name,
              })),
            ]}
          />
        )}

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Skadenca e regjistrimit"
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
            label="Inspektimi i fundit"
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
            label="Inspektimi i ardhshëm"
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
            label="Statusi"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as 'active' | 'inactive',
              })
            }
            options={[
              { value: 'active', label: 'Aktive' },
              { value: 'inactive', label: 'Joaktive' },
            ]}
          />
        )}
      </form>
    </Modal>
  );
}
