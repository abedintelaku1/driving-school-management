import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, EditIcon, EyeIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { mockInstructors, mockCars, licenseCategories, addInstructor, updateInstructor } from '../../utils/mockData';
import type { Instructor } from '../../types';
import { toast } from '../../hooks/useToast';
export function InstructorsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const filteredInstructors = useMemo(() => {
    return mockInstructors.filter(instructor => {
      if (statusFilter && instructor.status !== statusFilter) return false;
      if (categoryFilter && !instructor.categories.includes(categoryFilter)) return false;
      return true;
    });
  }, [statusFilter, categoryFilter]);
  const columns = [{
    key: 'name',
    label: 'Instructor',
    sortable: true,
    render: (_: unknown, instructor: Instructor) => <div className="flex items-center gap-3">
          <Avatar name={`${instructor.firstName} ${instructor.lastName}`} size="sm" />
          <div>
            <p className="font-medium text-gray-900">
              {instructor.firstName} {instructor.lastName}
            </p>
            <p className="text-sm text-gray-500">{instructor.email}</p>
          </div>
        </div>
  }, {
    key: 'phone',
    label: 'Phone'
  }, {
    key: 'categories',
    label: 'Categories',
    render: (value: unknown) => <div className="flex flex-wrap gap-1">
          {(value as string[]).map(cat => <Badge key={cat} variant="info" size="sm">
              {cat}
            </Badge>)}
        </div>
  }, {
    key: 'totalHours',
    label: 'Total Hours',
    sortable: true,
    render: (value: unknown) => <span className="font-semibold text-gray-900">{value as number}h</span>
  }, {
    key: 'assignedCarIds',
    label: 'Assigned Cars',
    render: (value: unknown) => {
      const carIds = value as string[];
      const cars = carIds.map(id => mockCars.find(c => c.id === id)).filter(Boolean);
      return cars.length > 0 ? <div className="flex flex-wrap gap-1">
            {cars.map(car => <Badge key={car!.id} variant="outline" size="sm">
                {car!.licensePlate}
              </Badge>)}
          </div> : <span className="text-gray-400">None</span>;
    }
  }, {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value: unknown) => <StatusBadge status={value as 'active' | 'inactive'} />
  }];
  const actions = (instructor: Instructor) => <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => setEditingInstructor(instructor)} icon={<EditIcon className="w-4 h-4" />}>
        Edit
      </Button>
    </div>;
  return <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
          <p className="text-gray-500 mt-1">
            Manage driving instructors and their assignments.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
          Add Instructor
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
            <Select placeholder="All Categories" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} options={[{
            value: '',
            label: 'All Categories'
          }, ...licenseCategories.map(cat => ({
            value: cat,
            label: `Category ${cat}`
          }))]} />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable data={filteredInstructors} columns={columns} keyExtractor={instructor => instructor.id} searchable searchPlaceholder="Search instructors..." searchKeys={['firstName', 'lastName', 'email', 'phone']} actions={actions} emptyMessage="No instructors found" />
      </Card>

      {/* Add/Edit Modal */}
      <AddInstructorModal isOpen={showAddModal || !!editingInstructor} onClose={() => {
      setShowAddModal(false);
      setEditingInstructor(null);
    }} instructor={editingInstructor} onSuccess={() => {
      setRefreshKey(prev => prev + 1);
      toast('success', editingInstructor ? 'Instructor updated successfully' : 'Instructor added successfully');
      setShowAddModal(false);
      setEditingInstructor(null);
    }} />
    </div>;
}
type AddInstructorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  instructor?: Instructor | null;
  onSuccess: () => void;
};
function AddInstructorModal({
  isOpen,
  onClose,
  instructor,
  onSuccess
}: AddInstructorModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    personalNumber: '',
    address: '',
    categories: [] as string[],
    assignedCarIds: [] as string[],
    status: 'active' as 'active' | 'inactive'
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (instructor) {
      setFormData({
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        email: instructor.email,
        phone: instructor.phone,
        dateOfBirth: instructor.dateOfBirth,
        personalNumber: instructor.personalNumber,
        address: instructor.address,
        categories: instructor.categories,
        assignedCarIds: instructor.assignedCarIds,
        status: instructor.status
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        personalNumber: '',
        address: '',
        categories: [],
        assignedCarIds: [],
        status: 'active'
      });
    }
  }, [instructor]);
  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category) ? prev.categories.filter(c => c !== category) : [...prev.categories, category]
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (instructor) {
        updateInstructor(instructor.id, formData);
      } else {
        addInstructor(formData);
      }
      onSuccess();
    } catch (error) {
      toast('error', 'Failed to save instructor');
    } finally {
      setLoading(false);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={instructor ? 'Edit Instructor' : 'Add New Instructor'} description="Enter the instructor's information to register them in the system." size="lg" footer={<div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {instructor ? 'Save Changes' : 'Add Instructor'}
          </Button>
        </div>}>
      <form className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" required value={formData.firstName} onChange={e => setFormData({
          ...formData,
          firstName: e.target.value
        })} />
          <Input label="Last Name" required value={formData.lastName} onChange={e => setFormData({
          ...formData,
          lastName: e.target.value
        })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({
          ...formData,
          email: e.target.value
        })} />
          <Input label="Phone" type="tel" required value={formData.phone} onChange={e => setFormData({
          ...formData,
          phone: e.target.value
        })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Date of Birth" type="date" required value={formData.dateOfBirth} onChange={e => setFormData({
          ...formData,
          dateOfBirth: e.target.value
        })} />
          <Input label="Personal Number" required value={formData.personalNumber} onChange={e => setFormData({
          ...formData,
          personalNumber: e.target.value
        })} />
        </div>

        <Input label="Address" required value={formData.address} onChange={e => setFormData({
        ...formData,
        address: e.target.value
      })} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Categories
          </label>
          <div className="grid grid-cols-4 gap-2">
            {licenseCategories.map(category => <Checkbox key={category} label={category} checked={formData.categories.includes(category)} onChange={() => handleCategoryToggle(category)} />)}
          </div>
        </div>

        <Select label="Assign Cars" value="" onChange={e => {
        if (e.target.value && !formData.assignedCarIds.includes(e.target.value)) {
          setFormData(prev => ({
            ...prev,
            assignedCarIds: [...prev.assignedCarIds, e.target.value]
          }));
        }
      }} options={mockCars.filter(c => c.status === 'active').map(car => ({
        value: car.id,
        label: `${car.model} (${car.licensePlate})`,
        disabled: formData.assignedCarIds.includes(car.id)
      }))} placeholder="Select cars to assign" />
        {formData.assignedCarIds.length > 0 && <div className="flex flex-wrap gap-2">
            {formData.assignedCarIds.map(carId => {
          const car = mockCars.find(c => c.id === carId);
          return car ? <Badge key={carId} variant="info" className="cursor-pointer" onClick={() => setFormData(prev => ({
            ...prev,
            assignedCarIds: prev.assignedCarIds.filter(id => id !== carId)
          }))}>
                  {car.licensePlate} ×
                </Badge> : null;
        })}
          </div>}
      </form>
    </Modal>;
}