import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, EditIcon, EyeIcon, AlertTriangleIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { mockCars, addCar, updateCar } from '../../utils/mockData';
import type { Car } from '../../types';
import { toast } from '../../hooks/useToast';
export function CarsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [transmissionFilter, setTransmissionFilter] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const filteredCars = useMemo(() => {
    return mockCars.filter(car => {
      if (statusFilter && car.status !== statusFilter) return false;
      if (transmissionFilter && car.transmission !== transmissionFilter) return false;
      return true;
    });
  }, [statusFilter, transmissionFilter]);
  const getDaysUntilInspection = (date: string) => {
    const inspection = new Date(date);
    const today = new Date();
    return Math.ceil((inspection.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  const columns = [{
    key: 'model',
    label: 'Vehicle',
    sortable: true,
    render: (_: unknown, car: Car) => <div>
          <p className="font-medium text-gray-900">{car.model}</p>
          <p className="text-sm text-gray-500">{car.yearOfManufacture}</p>
        </div>
  }, {
    key: 'licensePlate',
    label: 'License Plate',
    sortable: true,
    render: (value: unknown) => <span className="font-mono text-gray-900">{value as string}</span>
  }, {
    key: 'transmission',
    label: 'Transmission',
    render: (value: unknown) => <Badge variant="outline">
          {(value as string).charAt(0).toUpperCase() + (value as string).slice(1)}
        </Badge>
  }, {
    key: 'fuelType',
    label: 'Fuel',
    render: (value: unknown) => <span className="text-gray-700 capitalize">{value as string}</span>
  }, {
    key: 'totalHours',
    label: 'Total Hours',
    sortable: true,
    render: (value: unknown) => <span className="font-semibold text-gray-900">{value as number}h</span>
  }, {
    key: 'nextInspection',
    label: 'Next Inspection',
    sortable: true,
    render: (value: unknown) => {
      const days = getDaysUntilInspection(value as string);
      const isUrgent = days <= 30;
      return <div className="flex items-center gap-2">
            {isUrgent && <AlertTriangleIcon className="w-4 h-4 text-amber-500" />}
            <span className={isUrgent ? 'text-amber-600 font-medium' : 'text-gray-700'}>
              {value as string}
            </span>
          </div>;
    }
  }, {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value: unknown) => <StatusBadge status={value as 'active' | 'inactive'} />
  }];
  const actions = (car: Car) => <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => setEditingCar(car)} icon={<EditIcon className="w-4 h-4" />}>
        Edit
      </Button>
    </div>;
  return <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cars</h1>
          <p className="text-gray-500 mt-1">
            Manage driving school vehicles and their maintenance.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
          Add Car
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="w-48">
            <Select placeholder="All Statuses" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{
            value: '',
            label: 'All Statuses'
          }, {
            value: 'active',
            label: 'Active'
          }, {
            value: 'inactive',
            label: 'Inactive'
          }]} />
          </div>
          <div className="w-48">
            <Select placeholder="All Transmissions" value={transmissionFilter} onChange={e => setTransmissionFilter(e.target.value)} options={[{
            value: '',
            label: 'All Transmissions'
          }, {
            value: 'manual',
            label: 'Manual'
          }, {
            value: 'automatic',
            label: 'Automatic'
          }]} />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable data={filteredCars} columns={columns} keyExtractor={car => car.id} searchable searchPlaceholder="Search cars..." searchKeys={['model', 'licensePlate', 'chassisNumber']} actions={actions} emptyMessage="No cars found" />
      </Card>

      {/* Add/Edit Modal */}
      <AddCarModal isOpen={showAddModal || !!editingCar} onClose={() => {
      setShowAddModal(false);
      setEditingCar(null);
    }} car={editingCar} onSuccess={() => {
      setRefreshKey(prev => prev + 1);
      toast('success', editingCar ? 'Car updated successfully' : 'Car added successfully');
      setShowAddModal(false);
      setEditingCar(null);
    }} />
    </div>;
}
type AddCarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  car?: Car | null;
  onSuccess: () => void;
};
function AddCarModal({
  isOpen,
  onClose,
  car,
  onSuccess
}: AddCarModalProps) {
  const [formData, setFormData] = useState({
    model: '',
    yearOfManufacture: '',
    chassisNumber: '',
    transmission: '',
    fuelType: '',
    licensePlate: '',
    ownership: '',
    registrationExpiry: '',
    lastInspection: '',
    nextInspection: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (car) {
      setFormData({
        model: car.model,
        yearOfManufacture: car.yearOfManufacture.toString(),
        chassisNumber: car.chassisNumber,
        transmission: car.transmission,
        fuelType: car.fuelType,
        licensePlate: car.licensePlate,
        ownership: car.ownership,
        registrationExpiry: car.registrationExpiry,
        lastInspection: car.lastInspection,
        nextInspection: car.nextInspection,
        status: car.status
      });
    } else {
      setFormData({
        model: '',
        yearOfManufacture: '',
        chassisNumber: '',
        transmission: '',
        fuelType: '',
        licensePlate: '',
        ownership: '',
        registrationExpiry: '',
        lastInspection: '',
        nextInspection: '',
        status: 'active'
      });
    }
  }, [car]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const carData = {
        ...formData,
        yearOfManufacture: parseInt(formData.yearOfManufacture),
        transmission: formData.transmission as 'manual' | 'automatic',
        fuelType: formData.fuelType as 'petrol' | 'diesel' | 'electric' | 'hybrid',
        ownership: formData.ownership as 'owned' | 'leased' | 'rented'
      };
      if (car) {
        updateCar(car.id, carData);
      } else {
        addCar(carData);
      }
      onSuccess();
    } catch (error) {
      toast('error', 'Failed to save car');
    } finally {
      setLoading(false);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={car ? 'Edit Car' : 'Add New Car'} description="Enter the vehicle information to register it in the system." size="lg" footer={<div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {car ? 'Save Changes' : 'Add Car'}
          </Button>
        </div>}>
      <form className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Model" required value={formData.model} onChange={e => setFormData({
          ...formData,
          model: e.target.value
        })} placeholder="e.g., Toyota Corolla" />
          <Input label="Year of Manufacture" type="number" required value={formData.yearOfManufacture} onChange={e => setFormData({
          ...formData,
          yearOfManufacture: e.target.value
        })} placeholder="e.g., 2022" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Chassis Number" required value={formData.chassisNumber} onChange={e => setFormData({
          ...formData,
          chassisNumber: e.target.value
        })} />
          <Input label="License Plate" required value={formData.licensePlate} onChange={e => setFormData({
          ...formData,
          licensePlate: e.target.value
        })} placeholder="e.g., ABC-1234" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select label="Transmission" required value={formData.transmission} onChange={e => setFormData({
          ...formData,
          transmission: e.target.value
        })} options={[{
          value: 'manual',
          label: 'Manual'
        }, {
          value: 'automatic',
          label: 'Automatic'
        }]} />
          <Select label="Fuel Type" required value={formData.fuelType} onChange={e => setFormData({
          ...formData,
          fuelType: e.target.value
        })} options={[{
          value: 'petrol',
          label: 'Petrol'
        }, {
          value: 'diesel',
          label: 'Diesel'
        }, {
          value: 'electric',
          label: 'Electric'
        }, {
          value: 'hybrid',
          label: 'Hybrid'
        }]} />
          <Select label="Ownership" required value={formData.ownership} onChange={e => setFormData({
          ...formData,
          ownership: e.target.value
        })} options={[{
          value: 'owned',
          label: 'Owned'
        }, {
          value: 'leased',
          label: 'Leased'
        }, {
          value: 'rented',
          label: 'Rented'
        }]} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="Registration Expiry" type="date" required value={formData.registrationExpiry} onChange={e => setFormData({
          ...formData,
          registrationExpiry: e.target.value
        })} />
          <Input label="Last Inspection" type="date" required value={formData.lastInspection} onChange={e => setFormData({
          ...formData,
          lastInspection: e.target.value
        })} />
          <Input label="Next Inspection" type="date" required value={formData.nextInspection} onChange={e => setFormData({
          ...formData,
          nextInspection: e.target.value
        })} />
        </div>
      </form>
    </Modal>;
}