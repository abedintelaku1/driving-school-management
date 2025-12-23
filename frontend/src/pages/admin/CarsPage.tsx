import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, AlertTriangleIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Car } from '../../types';
import { toast } from '../../hooks/useToast';
import { api } from '../../utils/api';

export function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [deletingCar, setDeletingCar] = useState<Car | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [transmissionFilter, setTransmissionFilter] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

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
          toast('error', 'Failed to load cars');
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
        toast('error', 'Failed to load cars');
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

  const getDaysUntilInspection = (date: string) => {
    const inspection = new Date(date);
    const today = new Date();
    return Math.ceil((inspection.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
        toast('error', (data as any)?.message || 'Failed to delete car');
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      toast('error', 'Failed to delete car');
    }
  };

  const columns = [
    {
      key: 'model',
      label: 'Vehicle',
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
      label: 'License Plate',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-mono text-gray-900">{value as string}</span>
      ),
    },
    {
      key: 'transmission',
      label: 'Transmission',
      render: (value: unknown) => (
        <Badge variant="outline">
          {(value as string).charAt(0).toUpperCase() + (value as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'fuelType',
      label: 'Fuel',
      render: (value: unknown) => (
        <span className="text-gray-700 capitalize">{value as string}</span>
      ),
    },
    {
      key: 'totalHours',
      label: 'Total Hours',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">{value as number}h</span>
      ),
    },
    {
      key: 'nextInspection',
      label: 'Next Inspection',
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
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDelete(car)}
        icon={<TrashIcon className="w-4 h-4" />}
      >
        Delete
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
            <Select
              placeholder="All Statuses"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
          <div className="w-48">
            <Select
              placeholder="All Transmissions"
              value={transmissionFilter}
              onChange={(e) => setTransmissionFilter(e.target.value)}
              options={[
                { value: '', label: 'All Transmissions' },
                { value: 'manual', label: 'Manual' },
                { value: 'automatic', label: 'Automatic' },
              ]}
            />
          </div>
        </div>
      </Card>

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
          toast('success', editingCar ? 'Car updated successfully' : 'Car added successfully');
          setShowAddModal(false);
          setEditingCar(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingCar && (
        <Modal
          isOpen={!!deletingCar}
          onClose={() => setDeletingCar(null)}
          title="Delete Car"
          description={`Are you sure you want to delete ${deletingCar.model} (${deletingCar.licensePlate})? This action cannot be undone.`}
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeletingCar(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Delete
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
    ownership: '',
    registrationExpiry: '',
    lastInspection: '',
    nextInspection: '',
    status: 'active' as 'active' | 'inactive',
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
        ownership: '',
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
      const carData = {
        model: formData.model.trim(),
        yearOfManufacture: parseInt(formData.yearOfManufacture),
        chassisNumber: formData.chassisNumber.trim(),
        transmission: formData.transmission as 'manual' | 'automatic',
        fuelType: formData.fuelType as 'petrol' | 'diesel' | 'electric' | 'hybrid',
        licensePlate: formData.licensePlate.trim(),
        ownership: formData.ownership as 'owned' | 'leased' | 'rented',
        registrationExpiry: formData.registrationExpiry,
        lastInspection: formData.lastInspection,
        nextInspection: formData.nextInspection,
        status: formData.status,
      };

      if (car) {
        // Update existing car
        const { ok, data } = await api.updateCar(car.id, carData);
        if (ok) {
          onSuccess();
        } else {
          toast('error', (data as any)?.message || 'Failed to update car');
        }
      } else {
        // Create new car
        const { ok, data } = await api.createCar(carData);
        if (ok) {
          onSuccess();
        } else {
          toast('error', (data as any)?.message || 'Failed to create car');
        }
      }
    } catch (error) {
      console.error('Error saving car:', error);
      toast('error', 'Failed to save car');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={car ? 'Edit Car' : 'Add New Car'}
      description="Enter the vehicle information to register it in the system."
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {car ? 'Save Changes' : 'Add Car'}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Model"
            required
            value={formData.model}
            onChange={(e) =>
              setFormData({
                ...formData,
                model: e.target.value,
              })
            }
            placeholder="e.g., Toyota Corolla"
          />
          <Input
            label="Year of Manufacture"
            type="number"
            required
            value={formData.yearOfManufacture}
            onChange={(e) =>
              setFormData({
                ...formData,
                yearOfManufacture: e.target.value,
              })
            }
            placeholder="e.g., 2022"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Chassis Number"
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
            label="License Plate"
            required
            value={formData.licensePlate}
            onChange={(e) =>
              setFormData({
                ...formData,
                licensePlate: e.target.value,
              })
            }
            placeholder="e.g., ABC-1234"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Transmission"
            required
            value={formData.transmission}
            onChange={(e) =>
              setFormData({
                ...formData,
                transmission: e.target.value,
              })
            }
            options={[
              { value: 'manual', label: 'Manual' },
              { value: 'automatic', label: 'Automatic' },
            ]}
          />
          <Select
            label="Fuel Type"
            required
            value={formData.fuelType}
            onChange={(e) =>
              setFormData({
                ...formData,
                fuelType: e.target.value,
              })
            }
            options={[
              { value: 'petrol', label: 'Petrol' },
              { value: 'diesel', label: 'Diesel' },
              { value: 'electric', label: 'Electric' },
              { value: 'hybrid', label: 'Hybrid' },
            ]}
          />
          <Select
            label="Ownership"
            required
            value={formData.ownership}
            onChange={(e) =>
              setFormData({
                ...formData,
                ownership: e.target.value,
              })
            }
            options={[
              { value: 'owned', label: 'Owned' },
              { value: 'leased', label: 'Leased' },
              { value: 'rented', label: 'Rented' },
            ]}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Registration Expiry"
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
            label="Last Inspection"
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
            label="Next Inspection"
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
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as 'active' | 'inactive',
              })
            }
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        )}
      </form>
    </Modal>
  );
}
