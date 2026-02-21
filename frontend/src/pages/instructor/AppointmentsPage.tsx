import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, EditIcon, XIcon, CheckIcon, DownloadIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { api } from '../../utils/api';
import { toast } from '../../hooks/useToast';
import { ConfirmModal } from '../../components/ui/Modal';
import jsPDF from 'jspdf';

type Appointment = {
  _id?: string;
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  hours?: number;
  notes?: string;
  status: string;
  candidate?: any;
  candidateId?: string;
  carId?: any;
  instructor?: any;
  instructorId?: string;
};

type Candidate = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status?: string;
};

type Car = {
  _id?: string;
  id?: string;
  model: string;
  licensePlate: string;
  transmission?: string;
  status?: string;
};

export function AppointmentsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  // Get instructor ID for filtering
  useEffect(() => {
    const fetchInstructorId = async () => {
      if (user?.role === 1) { // 1 = instructor
        try {
          const instructorRes = await api.getInstructorMe();
          if (instructorRes.ok && instructorRes.data) {
            const instructor = instructorRes.data;
            setInstructorId(instructor._id || instructor.id || null);
          }
        } catch (error) {
          console.error('Failed to fetch instructor ID:', error);
        }
      }
    };
    fetchInstructorId();
  }, [user]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      // For instructors, wait until instructorId is available
      if (user?.role === 1 && !instructorId) {
        return; // Don't fetch until instructorId is set
      }

      setLoading(true);
      try {
        let appointmentsRes;
        let candidatesRes;
        let carsRes;
        
        // If user is an instructor, fetch their appointments and candidates
        if (user?.role === 1 && instructorId) {
          // Fetch appointments for this instructor
          const instructorAppointmentsRes = await fetch(
            `${import.meta.env.VITE_API_URL || ''}/api/appointments/instructor/${instructorId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            }
          );
          const instructorAppointmentsData = await instructorAppointmentsRes.json();
          appointmentsRes = { ok: instructorAppointmentsRes.ok, data: instructorAppointmentsData };
          
          // Fetch all candidates and filter by instructor
          candidatesRes = await api.listCandidates();
          if (candidatesRes.ok && candidatesRes.data) {
            // Filter candidates assigned to this instructor
            const filteredCandidates = candidatesRes.data.filter((c: any) => {
              const candInstructorId = c.instructorId?._id || c.instructorId || c.instructor?._id || c.instructor?.id || c.instructorId;
              return candInstructorId === instructorId;
            });
            candidatesRes.data = filteredCandidates;
          }

          // Instructor: get only assigned cars
          console.log('Fetching cars for instructor...');
          carsRes = await api.getMyCars();
          console.log('Cars API response:', carsRes);
        } else if (user?.role === 0) {
          // Admin: fetch all appointments and candidates
          appointmentsRes = await api.listAppointments();
          candidatesRes = await api.listCandidates();
          // Admin: get all cars
          carsRes = await api.listCars();
        } else {
          // No user or unknown role
          appointmentsRes = { ok: false, data: [] };
          candidatesRes = { ok: false, data: [] };
          carsRes = { ok: false, data: [] };
        }

        if (appointmentsRes.ok && appointmentsRes.data) {
          setAppointments(appointmentsRes.data);
        }
        if (candidatesRes.ok && candidatesRes.data) {
          setCandidates(candidatesRes.data);
        }
        if (carsRes) {
          if (carsRes.ok && carsRes.data) {
            setCars(carsRes.data);
          } else {
            // Log error for debugging
            console.log('Cars API response:', carsRes);
            setCars([]);
          }
        }
      } catch (error) {
        toast('error', t('common.failedToLoadData'));
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if:
    // - User is admin (role 0), OR
    // - User is instructor (role 1) AND instructorId is available
    if (user?.role === 0 || (user?.role === 1 && instructorId)) {
      fetchData();
    }
  }, [user, instructorId]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        // Filter by status if statusFilter is set
        if (statusFilter && a.status !== statusFilter) return false;
        
        // For instructors, only show their own appointments
        if (user?.role === 1 && instructorId) {
          const aptInstructorId = a.instructorId?._id || a.instructorId || a.instructor?._id || a.instructor?.id || '';
          if (aptInstructorId !== instructorId) return false;
        }
        
        return true;
      })
      .map(apt => {
        // Format date - handle both ISO string and Date object
        let formattedDate = apt.date;
        if (apt.date) {
          if (typeof apt.date === 'string') {
            // If it's an ISO string, extract just the date part (YYYY-MM-DD)
            formattedDate = apt.date.split('T')[0];
          } else if (apt.date instanceof Date) {
            // If it's a Date object, format it
            formattedDate = apt.date.toISOString().split('T')[0];
          }
        }
        
        return {
          ...apt,
          id: apt._id || apt.id,
          date: formattedDate,
          candidateId: apt.candidateId?._id || apt.candidateId?.id || apt.candidate?._id || apt.candidate?.id || apt.candidateId,
          carId: apt.carId?._id || apt.carId?.id || apt.carId
        };
      })
      .sort((a, b) => {
        // Sort by date (descending) then by startTime (descending)
        const dateCompare = (b.date || '').localeCompare(a.date || '');
        if (dateCompare !== 0) return dateCompare;
        return (b.startTime || '').localeCompare(a.startTime || '');
      });
  }, [appointments, statusFilter, user, instructorId]);

  const getCandidateById = (id: string) => {
    return candidates.find(c => (c._id || c.id) === id);
  };

  const getCarById = (id: string) => {
    return cars.find(c => (c._id || c.id) === id);
  };

  const refreshAppointments = async () => {
    if (user?.role === 1 && instructorId) {
      // Instructor: fetch their appointments
      const instructorAppointmentsRes = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/appointments/instructor/${instructorId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      const instructorAppointmentsData = await instructorAppointmentsRes.json();
      if (instructorAppointmentsRes.ok && instructorAppointmentsData) {
        setAppointments(instructorAppointmentsData);
      }
    } else {
      // Admin: fetch all appointments
      const res = await api.listAppointments();
      if (res.ok && res.data) {
        setAppointments(res.data);
      }
    }
  };

  const handleExport = () => {
    if (!filteredAppointments.length) {
      toast('info', t('appointments.noAppointmentsToExport'));
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    if (exportFormat === 'csv') {
      const headers = [
        t('common.date'),
        t('appointments.startTime'),
        t('appointments.endTime'),
        t('candidates.candidateColumn'),
        t('cars.vehicleColumn'),
        t('appointments.hours'),
        t('common.status'),
        t('common.notes')
      ];
      const rows = filteredAppointments.map(apt => {
        const candidate = getCandidateById(apt.candidateId || '');
        const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : t('common.unknown');
        const car = getCarById(apt.carId || '');
        const carInfo = car ? `${car.model} (${car.licensePlate})` : '-';
        
        return [
          apt.date || '',
          apt.startTime || '',
          apt.endTime || '',
          candidateName,
          carInfo,
          (apt.hours || 0).toString(),
          apt.status === 'scheduled' ? t('appointments.scheduled') : apt.status === 'completed' ? t('appointments.completed') : apt.status === 'cancelled' ? t('appointments.cancelled') : apt.status || '',
          (apt.notes || '').replace(/"/g, '""')
        ];
      });

      const csv = [headers, ...rows]
        .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t('reports.csvFilenameMyAppointments')}_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast('success', t('appointments.exportedToCSV'));
    } else {
      // PDF Export
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(t('appointments.myAppointments'), 14, 20);
      doc.setFontSize(10);
      doc.text(`${t('reports.exportDate')}: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`${t('common.total')}: ${filteredAppointments.length} ${t('appointments.appointments')}`, 14, 37);
      
      let yPos = 50;
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(t('appointments.date'), 14, yPos);
      doc.text(t('appointments.time'), 50, yPos);
      doc.text(t('appointments.student'), 80, yPos);
      doc.text(t('appointments.vehicle'), 130, yPos);
      doc.text(t('appointments.hours'), 170, yPos);
      doc.text(t('common.status'), 185, yPos);
      
      yPos += 6;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      
      filteredAppointments.forEach((apt) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        const candidate = getCandidateById(apt.candidateId || '');
        const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : t('common.unknown');
        const car = getCarById(apt.carId || '');
        const carInfo = car ? `${car.model.substring(0, 10)}` : '-';
        const status = apt.status === 'scheduled' ? t('appointments.scheduled') : apt.status === 'completed' ? t('appointments.completed') : apt.status === 'cancelled' ? t('appointments.cancelled') : apt.status || '';
        
        doc.text((apt.date || '').substring(0, 10), 14, yPos);
        doc.text(`${(apt.startTime || '').substring(0, 5)}-${(apt.endTime || '').substring(0, 5)}`, 50, yPos);
        doc.text(candidateName.substring(0, 20), 80, yPos);
        doc.text(carInfo, 130, yPos);
        doc.text((apt.hours || 0).toString(), 170, yPos);
        doc.text(status.substring(0, 10), 185, yPos);
        yPos += 5;
      });
      
      doc.save(`${t('reports.csvFilenameMyAppointments')}_${timestamp}.pdf`);
      toast('success', t('appointments.exportedToPDF'));
    }
  };

  const columns = [
    {
      key: 'date',
      label: t('appointments.dateAndTime'),
      sortable: true,
      render: (_: unknown, appointment: Appointment) => {
        // Format date nicely
        const formatDate = (dateStr: string) => {
          if (!dateStr) return '';
          try {
            const date = new Date(dateStr);
            const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
            const locale = localeMap[language] || 'sq-AL';
            return date.toLocaleDateString(locale, {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
          } catch {
            return dateStr;
          }
        };
        
        return (
          <div className="min-w-[140px]">
            <p className="font-semibold text-gray-900 text-sm leading-tight">{formatDate(appointment.date || '')}</p>
            <p className="text-xs text-gray-600 font-medium mt-0.5">
              {appointment.startTime} - {appointment.endTime}
            </p>
          </div>
        );
      }
    },
    {
      key: 'candidateId',
      label: t('appointments.student'),
      render: (value: unknown) => {
        const candidate = getCandidateById(value as string);
        if (!candidate) return <span className="text-gray-400">{t('common.unknown')}</span>;
        return (
          <div className="flex items-center gap-3">
            <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="sm" />
            <div>
              <p className="font-medium text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </p>
              {candidate.phone && (
                <p className="text-sm text-gray-500">{candidate.phone}</p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'carId',
      label: t('appointments.vehicle'),
      render: (value: unknown) => {
        if (!value) return <span className="text-gray-400">-</span>;
        const car = getCarById(value as string);
        if (!car) return <span className="text-gray-400">-</span>;
        return (
          <div>
            <p className="text-gray-900">{car.model}</p>
            <p className="text-sm text-gray-500 font-mono">
              {car.licensePlate}
            </p>
          </div>
        );
      }
    },
    {
      key: 'hours',
      label: t('appointments.hours'),
      width: '60px',
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">
          {value ? `${value}h` : '-'}
        </span>
      )
    },
    {
      key: 'status',
      label: t('common.status'),
      sortable: true,
      width: '160px',
      render: (value: unknown) => {
        const status = value as string;
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
          completed: 'success',
          scheduled: 'warning',
          cancelled: 'danger'
        };
        const statusLabels: Record<string, string> = {
          completed: t('appointments.completed'),
          scheduled: t('appointments.scheduled'),
          cancelled: t('appointments.cancelled')
        };
        return (
          <Badge variant={variants[status] || 'outline'} dot className="whitespace-nowrap">
            {statusLabels[status] || status}
          </Badge>
        );
      }
    }
  ];

  const handleComplete = async (appointment: Appointment) => {
    const id = appointment._id || appointment.id;
    if (!id) return;
    
    const res = await api.updateAppointment(id, { status: 'completed' });
    if (res.ok) {
      await refreshAppointments();
      toast('success', t('appointments.appointmentUpdated'));
    } else {
      toast('error', t('appointments.failedToSave'));
    }
  };

  const handleCancel = async () => {
    if (!cancellingAppointment) return;
    
    const id = cancellingAppointment._id || cancellingAppointment.id;
    if (!id) return;

    const res = await api.updateAppointment(id, { status: 'cancelled' });
    if (res.ok) {
      await refreshAppointments();
      toast('success', t('appointments.appointmentCancelled'));
      setCancellingAppointment(null);
    } else {
      toast('error', t('appointments.failedToCancel'));
    }
  };

  const actions = (appointment: Appointment) => (
    <div className="flex items-center gap-1">
      {appointment.status === 'scheduled' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleComplete(appointment)}
            icon={<CheckIcon className="w-4 h-4 text-green-600" />}
            title={t('appointments.markAsCompleted')}
            className="whitespace-nowrap"
          >
            {t('appointments.markAsCompleted')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingAppointment(appointment)}
            icon={<EditIcon className="w-4 h-4 text-gray-600" />}
            title={t('common.edit')}
            className="whitespace-nowrap"
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCancellingAppointment(appointment)}
            icon={<XIcon className="w-4 h-4 text-red-600" />}
            title={t('appointments.cancelAppointment')}
            className="whitespace-nowrap"
          >
            {t('appointments.cancelAppointment')}
          </Button>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('appointments.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('appointments.subtitle')}
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
              disabled={filteredAppointments.length === 0}
            >
              {t('appointments.export')} {exportFormat.toUpperCase()}
            </Button>
          </div>
          <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
            {t('appointments.scheduleAppointment')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="w-48">
            <Select
              placeholder={t('appointments.allStatuses')}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: t('appointments.allStatuses') },
                { value: 'scheduled', label: t('appointments.scheduled') },
                { value: 'completed', label: t('appointments.completed') },
                { value: 'cancelled', label: t('appointments.cancelled') }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredAppointments}
          columns={columns}
          keyExtractor={appointment => appointment._id || appointment.id || ''}
          searchable
          searchPlaceholder={t('appointments.searchPlaceholder')}
          searchKeys={['notes']}
          actions={actions}
          emptyMessage={t('appointments.noAppointmentsFound')}
        />
      </Card>

      {/* Add/Edit Modal */}
      <AddAppointmentModal
        isOpen={showAddModal || !!editingAppointment}
        onClose={() => {
          setShowAddModal(false);
          setEditingAppointment(null);
        }}
        appointment={editingAppointment}
        candidates={candidates}
        cars={cars}
        onSuccess={async () => {
          await refreshAppointments();
          toast('success', editingAppointment ? t('appointments.appointmentUpdated') : t('appointments.appointmentScheduled'));
          setShowAddModal(false);
          setEditingAppointment(null);
        }}
      />

      {/* Cancel Confirmation */}
      <ConfirmModal
        isOpen={!!cancellingAppointment}
        onClose={() => setCancellingAppointment(null)}
        onConfirm={handleCancel}
        title={t('appointments.cancelAppointment')}
        message={t('appointments.confirmCancelAppointment')}
        confirmText={t('appointments.cancelAppointment')}
        variant="danger"
      />
    </div>
  );
}

type AddAppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  candidates: Candidate[];
  cars: Car[];
  onSuccess: () => void;
};

function AddAppointmentModal({
  isOpen,
  onClose,
  appointment,
  candidates,
  cars,
  onSuccess
}: AddAppointmentModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    candidateId: '',
    carId: '',
    date: '',
    startTime: '',
    endTime: '',
    hours: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  // Get instructor ID from user
  const [instructorId, setInstructorId] = useState<string | null>(null);

  // Calculate hours when times change
  // Note: 1 lesson hour = 45 minutes
  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return '';
    
    // Parse time strings (format: HH:mm)
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    // Convert to minutes for easier calculation
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    // Handle case where end time is next day (end < start)
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) {
      // End time is next day, add 24 hours
      diffMinutes += 24 * 60;
    }
    
    // Convert to lesson hours (45 minutes = 1 hour)
    const lessonHours = diffMinutes / 45;
    return lessonHours > 0 ? lessonHours.toFixed(2) : '';
  };

  useEffect(() => {
    const fetchInstructorId = async () => {
      if (user?.role === 0) { // 0 = admin
        // For admin editing, use the appointment's instructor
        if (appointment) {
          const id = appointment.instructor?._id || appointment.instructor?.id || appointment.instructorId;
          setInstructorId(id || null);
        }
      } else if (user?.role === 1) { // 1 = instructor
        // For instructor, fetch their own instructor profile
        const instructorRes = await api.getInstructorMe();
        if (instructorRes.ok && instructorRes.data) {
          const instructor = instructorRes.data;
          setInstructorId(instructor._id || instructor.id || null);
        }
      }
    };
    if (isOpen) {
      fetchInstructorId();
    }
  }, [isOpen, user, appointment]);

  useEffect(() => {
    if (appointment) {
      const startTime = appointment.startTime || '';
      const endTime = appointment.endTime || '';
      const calculatedHours = startTime && endTime ? calculateHours(startTime, endTime) : (appointment.hours?.toString() || '');
      
      // Format date for input field (YYYY-MM-DD)
      let formattedDate = appointment.date || '';
      if (formattedDate && typeof formattedDate === 'string' && formattedDate.includes('T')) {
        formattedDate = formattedDate.split('T')[0];
      } else if (formattedDate && formattedDate instanceof Date) {
        formattedDate = formattedDate.toISOString().split('T')[0];
      }
      
      setFormData({
        candidateId: appointment.candidateId?._id || appointment.candidateId?.id || appointment.candidate?._id || appointment.candidate?.id || appointment.candidateId || '',
        carId: appointment.carId?._id || appointment.carId?.id || appointment.carId || '',
        date: formattedDate,
        startTime: startTime,
        endTime: endTime,
        hours: calculatedHours,
        notes: appointment.notes || ''
      });
    } else {
      // Reset form when no appointment (creating new)
      setFormData({
        candidateId: '',
        carId: '',
        date: '',
        startTime: '',
        endTime: '',
        hours: '',
        notes: ''
      });
    }
  }, [appointment]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        candidateId: '',
        carId: '',
        date: '',
        startTime: '',
        endTime: '',
        hours: '',
        notes: ''
      });
      setInstructorId(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!instructorId) {
        toast('error', t('appointments.unableToDetermineInstructor'));
        setLoading(false);
        return;
      }

      // For instructors, carId is optional (will be assigned by admin)
      // For admins, carId is required
      if (user?.role === 0 && !formData.carId) {
        toast('error', t('appointments.pleaseSelectVehicle'));
        setLoading(false);
        return;
      }

      const appointmentData = {
        instructorId,
        candidateId: formData.candidateId,
        carId: formData.carId || (user?.role === 1 ? null : undefined),
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hours: formData.hours ? parseFloat(formData.hours) : undefined,
        notes: formData.notes || undefined,
        status: 'scheduled'
      };

      let res;
      if (appointment) {
        const id = appointment._id || appointment.id;
        if (!id) {
          toast('error', t('appointments.invalidAppointmentId'));
          setLoading(false);
          return;
        }
        res = await api.updateAppointment(id, appointmentData);
      } else {
        res = await api.createAppointment(appointmentData);
      }

      if (res.ok) {
        // Reset form after successful save
        setFormData({
          candidateId: '',
          carId: '',
          date: '',
          startTime: '',
          endTime: '',
          hours: '',
          notes: ''
        });
        onSuccess();
      } else {
        toast('error', res.data?.message || t('appointments.failedToSave'));
      }
    } catch (error) {
      toast('error', t('appointments.failedToSave'));
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates: for instructors, only show their assigned candidates
  const activeCandidates = useMemo(() => {
    let filtered = candidates.filter(c => !c.status || c.status === 'active');
    
    // If user is an instructor, filter by instructorId
    if (user?.role === 1 && instructorId) {
      filtered = filtered.filter(c => {
        const candInstructorId = c.instructorId?._id || c.instructorId || c.instructor?._id || c.instructor?.id || '';
        return candInstructorId === instructorId;
      });
    }
    
    return filtered;
  }, [candidates, user, instructorId]);
  
  const activeCars = cars.filter(c => !c.status || c.status === 'active');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appointment ? t('appointments.editAppointment') : t('appointments.scheduleAppointment')}
      description={appointment ? t('appointments.updateAppointmentDetails') : t('appointments.createAppointment')}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {appointment ? t('common.saveChanges') : t('appointments.scheduleAppointmentButton')}
          </Button>
        </div>
      }
    >
      <form className="space-y-6">
        <Select
          label={t('appointments.student')}
          required
          value={formData.candidateId}
          onChange={e => setFormData({ ...formData, candidateId: e.target.value })}
          options={activeCandidates.length > 0 ? activeCandidates.map(candidate => ({
            value: candidate._id || candidate.id || '',
            label: `${candidate.firstName} ${candidate.lastName}`
          })) : [{ value: '', label: t('appointments.noCandidatesAssigned') }]}
          disabled={activeCandidates.length === 0}
        />

        <Select
          label={t('appointments.vehicle')}
          required={user?.role === 0}
          value={formData.carId}
          onChange={e => setFormData({ ...formData, carId: e.target.value })}
          options={activeCars.length > 0 ? activeCars.map(car => ({
            value: car._id || car.id || '',
            label: `${car.model} (${car.licensePlate})${car.transmission ? ` - ${car.transmission}` : ''}`
          })) : [{ value: '', label: user?.role === 1 ? t('appointments.noCarsAssigned') : t('appointments.noCarsAvailable') }]}
          disabled={activeCars.length === 0}
        />

        <Input
          label={t('appointments.date')}
          type="date"
          required
          value={formData.date}
          onChange={e => setFormData({ ...formData, date: e.target.value })}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label={t('appointments.startTime')}
            type="time"
            required
            value={formData.startTime}
            onChange={e => {
              const newStart = e.target.value;
              setFormData({
                ...formData,
                startTime: newStart,
                hours: calculateHours(newStart, formData.endTime)
              });
            }}
          />
          <Input
            label={t('appointments.endTime')}
            type="time"
            required
            value={formData.endTime}
            onChange={e => {
              const newEnd = e.target.value;
              setFormData({
                ...formData,
                endTime: newEnd,
                hours: calculateHours(formData.startTime, newEnd)
              });
            }}
          />
          <Input
            label={t('appointments.hours')}
            type="number"
            required
            value={formData.hours}
            onChange={e => setFormData({ ...formData, hours: e.target.value })}
            hint={t('appointments.calculatedAutomatically')}
          />
        </div>

        <TextArea
          label={t('appointments.notes')}
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
          placeholder={t('appointments.notesPlaceholder')}
          rows={3}
        />
      </form>
    </Modal>
  );
}
