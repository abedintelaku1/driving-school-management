import React, { useEffect, useMemo, useState } from 'react';
import { MailIcon, PhoneIcon, ClockIcon, CalendarIcon, XIcon, MapPinIcon, PackageIcon, DownloadIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { DataTable } from '../../components/ui/DataTable';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { api } from '../../utils/api';
import { toast } from '../../hooks/useToast';
import type { Candidate } from '../../types';
import jsPDF from 'jspdf';
import { formatCurrentDate } from '../../utils/dateUtils';

type Appointment = {
  _id?: string;
  id?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  hours?: number;
  status: string;
  notes?: string;
  candidateId?: string | any;
  candidate?: {
    _id?: string;
    id?: string;
    firstName: string;
    lastName: string;
  };
  carId?: string | any;
  car?: {
    _id?: string;
    id?: string;
    model: string;
    licensePlate: string;
  };
};

type CandidateWithStats = Candidate & {
  completedHours: number;
  completedLessons: number;
  scheduledLessons: number;
  totalLessons: number;
  progress: number;
  packageInfo?: {
    name?: string;
    hours?: number;
    price?: number;
  };
};

type Car = {
  _id?: string;
  id?: string;
  model: string;
  licensePlate: string;
  transmission?: string;
  status?: string;
};

export function MyCandidatesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [packages, setPackages] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithStats | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [preSelectedCandidateId, setPreSelectedCandidateId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candidatesRes, appointmentsRes, carsRes] = await Promise.all([
          api.listCandidates(),
          api.getMyAppointments(),
          api.getMyCars()
        ]);

        if (candidatesRes.ok && candidatesRes.data) {
          // Transform candidates: convert _id to id
          const transformedCandidates = candidatesRes.data.map((cand: any) => ({
            ...cand,
            id: cand._id || cand.id,
            instructorId: cand.instructorId?._id || cand.instructorId?.id || cand.instructorId
          }));
          setCandidates(transformedCandidates);

          // Fetch package information for candidates that have packageId
          const packageIds = transformedCandidates
            .map((c: any) => c.packageId)
            .filter((id: string) => id && id.trim() !== '');
          
          if (packageIds.length > 0) {
            // Fetch packages (note: packages might be mock data, so handle errors gracefully)
            const packagePromises = packageIds.map(async (packageId: string) => {
              try {
                const packageRes = await api.getPackage(packageId);
                if (packageRes.ok && packageRes.data) {
                  return { id: packageId, data: packageRes.data };
                }
              } catch (error) {
                // Package might not exist or API might not be ready
                console.warn(`Package ${packageId} not found or API not available`);
              }
              return null;
            });
            
            const packageResults = await Promise.all(packagePromises);
            const packageMap: Record<string, any> = {};
            packageResults.forEach(result => {
              if (result) {
                packageMap[result.id] = result.data;
              }
            });
            setPackages(packageMap);
          }
        } else {
          toast('error', t('candidates.failedToLoad'));
        }

        if (appointmentsRes.ok && appointmentsRes.data) {
          // Transform appointments: convert _id to id, handle date format
          const transformedAppointments = appointmentsRes.data.map((apt: any) => ({
            ...apt,
            id: apt._id || apt.id,
            date: apt.date?.split('T')[0] || apt.date,
            candidateId: apt.candidateId?._id || apt.candidateId?.id || apt.candidateId,
            candidate: apt.candidateId || apt.candidate,
            carId: apt.carId?._id || apt.carId?.id || apt.carId,
            car: apt.carId || apt.car
          }));
          setAppointments(transformedAppointments);
        } else {
          toast('error', t('appointments.failedToLoadAppointments'));
        }

        if (carsRes.ok && carsRes.data) {
          const transformedCars = carsRes.data.map((car: any) => ({
            ...car,
            id: car._id || car.id
          }));
          setCars(transformedCars);
        }
      } catch (error) {
        console.error('Error fetching candidates data:', error);
        toast('error', t('common.failedToLoadData'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate statistics for each candidate
  const candidatesWithStats = useMemo<CandidateWithStats[]>(() => {
    return candidates.map(candidate => {
      const candidateId = candidate._id || candidate.id;
      
      // Get appointments for this candidate
      const candidateAppointments = appointments.filter(apt => {
        const aptCandidateId = apt.candidateId?._id || apt.candidateId?.id || apt.candidateId || apt.candidate?._id || apt.candidate?.id;
        return aptCandidateId === candidateId;
      });

      // Calculate statistics
      const completedAppointments = candidateAppointments.filter(a => a.status === 'completed');
      const scheduledAppointments = candidateAppointments.filter(a => a.status === 'scheduled');
      const completedHours = completedAppointments.reduce((sum, a) => sum + (a.hours || 0), 0);
      const completedLessons = completedAppointments.length;
      const scheduledLessons = scheduledAppointments.length;
      const totalLessons = candidateAppointments.length;

      // Get package info
      const packageId = (candidate as any).packageId;
      const packageInfo = packageId && packages[packageId] ? {
        name: packages[packageId].name || t('packages.package'),
        hours: packages[packageId].hours || packages[packageId].totalHours || 0,
        price: packages[packageId].price || 0
      } : undefined;

      // Calculate progress percentage
      let progress = 0;
      if (packageInfo && packageInfo.hours > 0) {
        progress = Math.min(100, Math.round((completedHours / packageInfo.hours) * 100));
      } else if (totalLessons > 0) {
        // If no package, show progress based on completed lessons
        progress = Math.round((completedLessons / totalLessons) * 100);
      }

      return {
        ...candidate,
        completedHours,
        completedLessons,
        scheduledLessons,
        totalLessons,
        progress,
        packageInfo
      };
    });
  }, [candidates, appointments, packages]);

  // Get appointments for selected candidate
  const candidateAppointments = useMemo(() => {
    if (!selectedCandidate) return [];
    const candidateId = selectedCandidate._id || selectedCandidate.id;
    return appointments
      .filter(apt => {
        const aptCandidateId = apt.candidateId?._id || apt.candidateId?.id || apt.candidateId || apt.candidate?._id || apt.candidate?.id;
        return aptCandidateId === candidateId;
      })
      .sort((a, b) => {
        const dateA = a.date?.split('T')[0] || a.date || '';
        const dateB = b.date?.split('T')[0] || b.date || '';
        return dateB.localeCompare(dateA);
      });
  }, [selectedCandidate, appointments]);

  const handleViewDetails = (candidate: CandidateWithStats) => {
    setSelectedCandidate(candidate);
    setShowDetailModal(true);
  };

  const handleScheduleLesson = (candidate: CandidateWithStats) => {
    setPreSelectedCandidateId(candidate._id || candidate.id || null);
    setShowScheduleModal(true);
  };

  const handleRefresh = async () => {
    // Refresh appointments after scheduling
    const appointmentsRes = await api.getMyAppointments();
    if (appointmentsRes.ok && appointmentsRes.data) {
      const transformedAppointments = appointmentsRes.data.map((apt: any) => ({
        ...apt,
        id: apt._id || apt.id,
        date: apt.date?.split('T')[0] || apt.date,
        candidateId: apt.candidateId?._id || apt.candidateId?.id || apt.candidateId,
        candidate: apt.candidateId || apt.candidate,
        carId: apt.carId?._id || apt.carId?.id || apt.carId,
        car: apt.carId || apt.car
      }));
      setAppointments(transformedAppointments);
    }
  };

  const handleExport = () => {
    if (!candidatesWithStats.length) {
      toast('info', t('myCandidates.noCandidatesToExport'));
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    if (exportFormat === 'csv') {
      const headers = [
        t('candidates.firstName'),
        t('candidates.lastName'),
        t('candidates.clientNumberColumn'),
        t('common.email'),
        t('common.phone'),
        t('instructors.totalLessons'),
        t('instructors.completedLessons'),
        t('candidates.completedHours'),
        t('candidates.progress'),
        t('candidates.statusColumn')
      ];
      const rows = candidatesWithStats.map(c => [
        c.firstName || '',
        c.lastName || '',
        c.uniqueClientNumber || '',
        c.email || '',
        c.phone || '',
        (c.totalLessons || 0).toString(),
        (c.completedLessons || 0).toString(),
        (c.completedHours || 0).toString(),
        `${c.progress || 0}%`,
        c.status === 'active' ? t('common.active') : t('common.inactive')
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
      link.setAttribute('download', `${t('reports.csvFilenameMyCandidates')}_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast('success', t('candidates.exportedToCSV'));
    } else {
      // PDF Export
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(t('candidates.myCandidates'), 14, 20);
      doc.setFontSize(10);
      const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
      const locale = localeMap[language] || 'sq-AL';
      doc.text(`${t('reports.exportDate')}: ${formatCurrentDate(locale)}`, 14, 30);
      doc.text(`${t('common.total')}: ${candidatesWithStats.length} ${t('candidates.candidates')}`, 14, 37);
      
      let yPos = 50;
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(t('common.firstName'), 14, yPos);
      doc.text(t('common.lastName'), 50, yPos);
      doc.text(t('candidates.clientNumber'), 85, yPos);
      doc.text(t('candidates.lessons'), 120, yPos);
      doc.text(t('candidates.hours'), 145, yPos);
      doc.text(t('candidates.progress'), 165, yPos);
      doc.text(t('common.status'), 190, yPos);
      
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      candidatesWithStats.forEach((c) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text((c.firstName || '').substring(0, 15), 14, yPos);
        doc.text((c.lastName || '').substring(0, 15), 50, yPos);
        doc.text((c.uniqueClientNumber || t('common.n/a')).substring(0, 12), 85, yPos);
        doc.text(c.totalLessons.toString(), 120, yPos);
        doc.text(c.completedHours.toString(), 145, yPos);
        doc.text(`${c.progress}%`, 165, yPos);
        doc.text(c.status === 'active' ? t('myCandidates.active') : t('myCandidates.inactive'), 190, yPos);
        yPos += 6;
      });
      
      doc.save(`${t('reports.csvFilenameMyCandidates')}_${timestamp}.pdf`);
      toast('success', t('candidates.exportedToPDF'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('myCandidates.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('myCandidates.subtitle')}
          </p>
        </div>
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
            disabled={candidatesWithStats.length === 0}
          >
            {t('myCandidates.export')} {exportFormat.toUpperCase()}
          </Button>
        </div>
      </div>

      {/* Students Grid */}
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{t('myCandidates.loading')}</p>
          </div>
        </Card>
      ) : candidatesWithStats.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{t('myCandidates.noCandidatesAssigned')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candidatesWithStats.map(candidate => {
            const candidateId = candidate._id || candidate.id;
            const packageName = candidate.packageInfo?.name || t('packages.package');
            const packageHours = candidate.packageInfo?.hours || 0;
            
            return (
              <Card key={candidateId}>
                <div className="flex items-start gap-4">
                  <Avatar 
                    name={`${candidate.firstName} ${candidate.lastName}`} 
                    size="lg" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        {candidate.uniqueClientNumber && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {candidate.uniqueClientNumber}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={candidate.status as 'active' | 'inactive'} />
                    </div>

                    <div className="mt-4 space-y-2">
                      {candidate.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MailIcon className="w-4 h-4 text-gray-400" />
                          <span>{candidate.email}</span>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <PhoneIcon className="w-4 h-4 text-gray-400" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {packageName}
                          {packageHours > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({packageHours}h)
                            </span>
                          )}
                        </span>
                        <Badge variant="info" size="sm">
                          {candidate.totalLessons > 0 ? t('myCandidates.active') : t('myCandidates.assigned')}
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>
                            {packageHours > 0 
                              ? t('myCandidates.hoursCompletedOf', { completed: candidate.completedHours, total: packageHours })
                              : t('myCandidates.hoursCompleted', { hours: candidate.completedHours })}
                          </span>
                          <span>{t('myCandidates.scheduled', { count: candidate.scheduledLessons })}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all" 
                            style={{ width: `${candidate.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{t('myCandidates.completed', { percent: candidate.progress })}</span>
                          <span>{t('myCandidates.totalLessons', { count: candidate.totalLessons })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        fullWidth
                        onClick={() => handleViewDetails(candidate)}
                      >
                        {t('myCandidates.viewDetails')}
                      </Button>
                      <Button 
                        size="sm" 
                        fullWidth
                        onClick={() => handleScheduleLesson(candidate)}
                      >
                        {t('myCandidates.scheduleLesson')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCandidate(null);
          }}
          candidate={selectedCandidate}
          appointments={candidateAppointments}
        />
      )}

      {/* Schedule Lesson Modal */}
      <ScheduleLessonModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setPreSelectedCandidateId(null);
        }}
        candidates={candidates}
        cars={cars}
        preSelectedCandidateId={preSelectedCandidateId}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

// Candidate Detail Modal Component
type CandidateDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateWithStats;
  appointments: Appointment[];
};

function CandidateDetailModal({
  isOpen,
  onClose,
  candidate,
  appointments
}: CandidateDetailModalProps) {
  const { t } = useLanguage();
  
  const appointmentColumns = [
    {
      key: 'date',
      label: t('common.date'),
      sortable: true
    },
    {
      key: 'time',
      label: t('appointments.time'),
      render: (_: unknown, apt: Appointment) => (
        <span>
          {apt.startTime} - {apt.endTime}
        </span>
      )
    },
    {
      key: 'hours',
      label: t('appointments.hours'),
      render: (value: unknown) => (
        <span className="font-semibold">{value ? `${value}h` : '-'}</span>
      )
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (value: unknown) => {
        const status = value as string;
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
          completed: 'success',
          scheduled: 'warning',
          cancelled: 'danger'
        };
        const labels: Record<string, string> = {
          completed: t('appointments.completed'),
          scheduled: t('appointments.scheduled'),
          cancelled: t('appointments.cancelled')
        };
        return (
          <Badge variant={variants[status] || 'outline'} size="sm">
            {labels[status] || status?.charAt(0).toUpperCase() + status?.slice(1)}
          </Badge>
        );
      }
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${candidate.firstName} ${candidate.lastName}`}
      description={t('myCandidates.studentDetailsDescription')}
      size="lg"
    >
      <div className="space-y-6">
        {/* Candidate Information */}
        <Card padding="sm">
          <div className="flex items-start gap-4">
            <Avatar 
              name={`${candidate.firstName} ${candidate.lastName}`} 
              size="xl" 
            />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {candidate.firstName} {candidate.lastName}
                  </h3>
                  {candidate.uniqueClientNumber && (
                    <p className="text-sm text-gray-500 mt-1">
                      {t('candidates.clientNumber')}: {candidate.uniqueClientNumber}
                    </p>
                  )}
                </div>
                <StatusBadge status={candidate.status as 'active' | 'inactive'} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidate.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <MailIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{candidate.email}</span>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{candidate.phone}</span>
                  </div>
                )}
                {candidate.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{candidate.address}</span>
                  </div>
                )}
                {candidate.packageInfo && (
                  <div className="flex items-center gap-2 text-sm">
                    <PackageIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {candidate.packageInfo.name}
                      {candidate.packageInfo.hours > 0 && ` (${candidate.packageInfo.hours}h)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-sm text-gray-500">{t('myCandidates.totalLessonsLabel')}</p>
              <p className="text-2xl font-bold text-gray-900">{candidate.totalLessons}</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-sm text-gray-500">{t('myCandidates.completedHours')}</p>
              <p className="text-2xl font-bold text-gray-900">{candidate.completedHours}h</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-sm text-gray-500">{t('myCandidates.scheduledLabel')}</p>
              <p className="text-2xl font-bold text-gray-900">{candidate.scheduledLessons}</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-sm text-gray-500">{t('myCandidates.progressLabel')}</p>
              <p className="text-2xl font-bold text-gray-900">{candidate.progress}%</p>
            </div>
          </Card>
        </div>

        {/* Appointments History */}
        <Card padding="none">
          <CardHeader>
            <CardTitle>{t('myCandidates.lessonHistory')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('myCandidates.noAppointmentsScheduled')}
              </div>
            ) : (
              <DataTable
                data={appointments}
                columns={appointmentColumns}
                keyExtractor={item => item._id || item.id || ''}
                searchable={false}
                pagination={appointments.length > 10}
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Modal>
  );
}

// Schedule Lesson Modal Component
type ScheduleLessonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  cars: Car[];
  preSelectedCandidateId: string | null;
  onSuccess: () => void;
};

function ScheduleLessonModal({
  isOpen,
  onClose,
  candidates,
  cars,
  preSelectedCandidateId,
  onSuccess
}: ScheduleLessonModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
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
  const [instructorId, setInstructorId] = useState<string | null>(null);

  // Calculate hours when times change
  // Note: 1 lesson hour = 45 minutes
  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return '';
    
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }
    
    // Convert to lesson hours (45 minutes = 1 hour)
    const lessonHours = diffMinutes / 45;
    return lessonHours > 0 ? lessonHours.toFixed(2) : '';
  };

  // Fetch instructor ID
  useEffect(() => {
    const fetchInstructorId = async () => {
      if (user?.role === 1) {
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
  }, [isOpen, user]);

  // Set pre-selected candidate
  useEffect(() => {
    if (isOpen && preSelectedCandidateId) {
      setFormData(prev => ({
        ...prev,
        candidateId: preSelectedCandidateId
      }));
    } else if (!isOpen) {
      // Reset form when modal closes
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
  }, [isOpen, preSelectedCandidateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!instructorId) {
        toast('error', t('appointments.unableToDetermineInstructor'));
        setLoading(false);
        return;
      }

      if (!formData.candidateId) {
        toast('error', t('appointments.pleaseSelectStudent'));
        setLoading(false);
        return;
      }

      const appointmentData = {
        instructorId,
        candidateId: formData.candidateId,
        carId: formData.carId || null,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hours: formData.hours ? parseFloat(formData.hours) : undefined,
        notes: formData.notes || undefined,
        status: 'scheduled'
      };

      const res = await api.createAppointment(appointmentData);

      if (res.ok) {
        toast('success', t('appointments.appointmentScheduledSuccess'));
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
        onClose();
      } else {
        toast('error', res.data?.message || t('appointments.failedToSchedule'));
      }
    } catch (error) {
      toast('error', t('appointments.failedToSchedule'));
    } finally {
      setLoading(false);
    }
  };

  const activeCandidates = candidates.filter(c => !c.status || c.status === 'active');
  const activeCars = cars.filter(c => !c.status || c.status === 'active');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('appointments.scheduleAppointment')}
      description={t('appointments.createAppointment')}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {t('appointments.scheduleAppointmentButton')}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
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
          value={formData.carId}
          onChange={e => setFormData({ ...formData, carId: e.target.value })}
          options={activeCars.length > 0 ? [
            { value: '', label: t('appointments.notAssigned') },
            ...activeCars.map(car => ({
              value: car._id || car.id || '',
              label: `${car.model} (${car.licensePlate})${car.transmission ? ` - ${car.transmission}` : ''}`
            }))
          ] : [{ value: '', label: t('appointments.noCarsAssigned') }]}
          disabled={activeCars.length === 0}
          hint={activeCars.length === 0 ? t('appointments.carWillBeAssignedByAdmin') : undefined}
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
