import React, { useState, useEffect, useMemo } from 'react';
import { DownloadIcon, CalendarIcon, ClockIcon, UsersIcon, TrendingUpIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { api } from '../../utils/api';
import { toast } from '../../hooks/useToast';
import jsPDF from 'jspdf';

type Appointment = {
  _id?: string;
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  hours?: number;
  status: string;
  candidateId?: string | any;
  candidate?: {
    _id?: string;
    id?: string;
    firstName: string;
    lastName: string;
    uniqueClientNumber?: string;
  };
};

type Candidate = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  uniqueClientNumber?: string;
  status?: string;
  instructorId?: string | any;
};

type CandidateStat = {
  id: string;
  name: string;
  clientNumber?: string;
  totalLessons: number;
  completedLessons: number;
  hours: number;
  status: string;
};

export function MyReportsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [appointmentsRes, candidatesRes] = await Promise.all([
          api.getMyAppointments(),
          api.listCandidates()
        ]);

        if (appointmentsRes.ok && appointmentsRes.data) {
          // Transform appointments: convert _id to id, handle date format
          const transformedAppointments = appointmentsRes.data.map((apt: any) => ({
            ...apt,
            id: apt._id || apt.id,
            date: apt.date?.split('T')[0] || apt.date, // Convert ISO date to YYYY-MM-DD
            candidateId: apt.candidateId?._id || apt.candidateId?.id || apt.candidateId,
            candidate: apt.candidateId || apt.candidate
          }));
          setAppointments(transformedAppointments);
        } else {
          toast('error', t('myReports.failedToLoadAppointments'));
        }

        if (candidatesRes.ok && candidatesRes.data) {
          // Transform candidates: convert _id to id
          const transformedCandidates = candidatesRes.data.map((cand: any) => ({
            ...cand,
            id: cand._id || cand.id,
            instructorId: cand.instructorId?._id || cand.instructorId?.id || cand.instructorId
          }));
          setCandidates(transformedCandidates);
        } else {
          toast('error', t('myReports.failedToLoadCandidates'));
        }
      } catch (error) {
        console.error('Error fetching reports data:', error);
        toast('error', t('myReports.failedToLoadData'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter appointments by date range
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const aptDate = a.date?.split('T')[0] || a.date;
      if (dateFrom && aptDate < dateFrom) return false;
      if (dateTo && aptDate > dateTo) return false;
      return true;
    });
  }, [appointments, dateFrom, dateTo]);

  const completedAppointments = useMemo(() => {
    return filteredAppointments.filter(a => a.status === 'completed');
  }, [filteredAppointments]);

  const totalHours = useMemo(() => {
    return completedAppointments.reduce((sum, a) => sum + (a.hours || 0), 0);
  }, [completedAppointments]);

  const cancelledCount = useMemo(() => {
    return filteredAppointments.filter(a => a.status === 'cancelled').length;
  }, [filteredAppointments]);

  // Calculate stats by candidate
  const candidateStats = useMemo<CandidateStat[]>(() => {
    return candidates.map(candidate => {
      const candidateAppointments = filteredAppointments.filter(a => {
        const aptCandidateId = a.candidateId?._id || a.candidateId?.id || a.candidateId || a.candidate?._id || a.candidate?.id;
        const candId = candidate._id || candidate.id;
        return aptCandidateId === candId;
      });
      const completed = candidateAppointments.filter(a => a.status === 'completed');
      const hours = completed.reduce((sum, a) => sum + (a.hours || 0), 0);
      return {
        id: candidate._id || candidate.id || '',
        name: `${candidate.firstName} ${candidate.lastName}`,
        clientNumber: candidate.uniqueClientNumber,
        totalLessons: candidateAppointments.length,
        completedLessons: completed.length,
        hours,
        status: candidate.status || 'active'
      };
    });
  }, [candidates, filteredAppointments]);

  // Helper function to get candidate name
  const getCandidateName = (candidateId: string | any): string => {
    if (!candidateId) return '-';
    const id = candidateId._id || candidateId.id || candidateId;
    const candidate = candidates.find(c => (c._id || c.id) === id);
    if (candidate) {
      return `${candidate.firstName} ${candidate.lastName}`;
    }
    // Check if candidateId is already populated
    if (typeof candidateId === 'object' && candidateId.firstName) {
      return `${candidateId.firstName} ${candidateId.lastName}`;
    }
    return '-';
  };

  const appointmentColumns = [
    {
      key: 'date',
      label: t('appointments.date'),
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
      key: 'candidateId',
      label: t('appointments.student'),
      render: (value: unknown, apt: Appointment) => {
        // Try to get candidate name from populated data or lookup
        if (apt.candidate) {
          return `${apt.candidate.firstName} ${apt.candidate.lastName}`;
        }
        return getCandidateName(value as string);
      }
    },
    {
      key: 'hours',
      label: t('appointments.hours'),
      render: (value: unknown) => (
        <span className="font-semibold">{value as number}h</span>
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
        const statusLabels: Record<string, string> = {
          completed: t('appointments.completed'),
          scheduled: t('appointments.scheduled'),
          cancelled: t('appointments.cancelled')
        };
        return (
          <Badge variant={variants[status] || 'warning'} size="sm">
            {statusLabels[status] || status}
          </Badge>
        );
      }
    }
  ];

  const candidateColumns = [
    {
      key: 'name',
      label: t('appointments.student'),
      sortable: true,
      render: (_: unknown, item: CandidateStat) => (
        <div>
          <p className="font-medium">{item.name}</p>
          {item.clientNumber && (
            <p className="text-sm text-gray-500">{item.clientNumber}</p>
          )}
        </div>
      )
    },
    {
      key: 'completedLessons',
      label: t('instructors.completedLessons'),
      sortable: true
    },
    {
      key: 'totalLessons',
      label: t('instructors.totalLessons'),
      sortable: true
    },
    {
      key: 'hours',
      label: t('appointments.hours'),
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{value as number}h</span>
      )
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (value: unknown) => (
        <Badge variant={value === 'active' ? 'success' : 'danger'} dot size="sm">
          {value === 'active' ? t('common.active') : t('common.inactive')}
        </Badge>
      )
    }
  ];

  // Export report to CSV or PDF
  const handleExportReport = () => {
    try {
      const dateRange = dateFrom && dateTo 
        ? `${dateFrom}_to_${dateTo}` 
        : dateFrom 
        ? `from_${dateFrom}` 
        : dateTo 
        ? `to_${dateTo}` 
        : 'all';
      const timestamp = new Date().toISOString().split('T')[0];

      if (exportFormat === 'csv') {
        const filename = `${t('reports.csvFilenameMyReports')}_${dateRange}_${timestamp}.csv`;

        // Get locale for date formatting
        const localeMap: Record<string, string> = {
          sq: 'sq-AL',
          en: 'en-US',
          sr: 'sr-RS'
        };
        const locale = localeMap[language] || 'sq-AL';
        
        let csvContent = `${t('reports.instructorReportsExport')}\n`;
        csvContent += `${t('reports.generated')}: ${new Date().toLocaleString(locale)}\n`;
        if (dateFrom || dateTo) {
          csvContent += `${t('reports.period')}: ${dateFrom || t('reports.all')} - ${dateTo || t('reports.all')}\n`;
        }
        csvContent += '\n';

        // 1. Summary Statistics
        csvContent += `=== ${t('reports.summaryStatistics')} ===\n`;
        csvContent += `${t('reports.indicator')},${t('reports.value')}\n`;
        csvContent += `${t('instructors.totalLessons')},${filteredAppointments.length}\n`;
        csvContent += `${t('instructors.completedLessons')},${completedAppointments.length}\n`;
        csvContent += `${t('reports.hoursTaught')},${totalHours}h\n`;
        csvContent += `${t('reports.cancelledLessons')},${cancelledCount}\n`;
        csvContent += `${t('reports.totalStudents')},${candidates.length}\n`;
        csvContent += `${t('reports.completionRate')},${filteredAppointments.length > 0 ? Math.round((completedAppointments.length / filteredAppointments.length) * 100) : 0}%\n`;
        csvContent += '\n';

        // 2. Student Performance
        csvContent += `=== ${t('reports.studentPerformance')} ===\n`;
        csvContent += `${t('reports.studentName')},${t('candidates.clientNumberColumn')},${t('instructors.totalLessons')},${t('instructors.completedLessons')},${t('candidates.completedHours')},${t('reports.statusColumn')}\n`;
        candidateStats.forEach(stat => {
          const statusText = stat.status === 'active' ? t('common.active') : t('common.inactive');
          csvContent += `"${stat.name}","${stat.clientNumber || ''}",${stat.totalLessons},${stat.completedLessons},${stat.hours},"${statusText}"\n`;
        });
        csvContent += '\n';

        // 3. Lesson History
        csvContent += `=== ${t('reports.lessonHistory')} ===\n`;
        csvContent += `${t('common.date')},${t('reports.time')},${t('reports.student')},${t('appointments.hours')},${t('reports.statusColumn')}\n`;
        filteredAppointments
          .sort((a, b) => {
            const dateA = a.date?.split('T')[0] || a.date || '';
            const dateB = b.date?.split('T')[0] || b.date || '';
            return dateB.localeCompare(dateA);
          })
          .forEach(apt => {
            const studentName = apt.candidate 
              ? `${apt.candidate.firstName} ${apt.candidate.lastName}`
              : getCandidateName(apt.candidateId);
            const statusLabels: Record<string, string> = {
              completed: t('appointments.completed'),
              scheduled: t('appointments.scheduled'),
              cancelled: t('appointments.cancelled')
            };
            const statusText = statusLabels[apt.status] || apt.status;
            csvContent += `"${apt.date?.split('T')[0] || apt.date || ''}","${apt.startTime || ''} - ${apt.endTime || ''}","${studentName}",${apt.hours || 0},"${statusText}"\n`;
          });

        // Download CSV with UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast('success', t('reports.exportedToCSV'));
      } else {
        // PDF Export
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(t('reports.myReports'), 14, 20);
        doc.setFontSize(10);
        const localeMap: Record<string, string> = {
          sq: 'sq-AL',
          en: 'en-US',
          sr: 'sr-RS'
        };
        const locale = localeMap[language] || 'sq-AL';
        doc.text(`${t('reports.exportDate')}: ${new Date().toLocaleDateString(locale)}`, 14, 30);
        if (dateFrom || dateTo) {
          doc.text(`${t('reports.period')}: ${dateFrom || t('reports.all')} ${t('common.to')} ${dateTo || t('reports.all')}`, 14, 37);
        }
        
        let yPos = 50;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(t('reports.summaryStatistics'), 14, yPos);
        yPos += 8;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(`${t('instructors.totalLessons')}: ${filteredAppointments.length}`, 14, yPos);
        yPos += 6;
        doc.text(`${t('instructors.completedLessons')}: ${completedAppointments.length}`, 14, yPos);
        yPos += 6;
        doc.text(`${t('reports.hoursTaught')}: ${totalHours}h`, 14, yPos);
        yPos += 6;
        doc.text(`${t('reports.cancelledLessons')}: ${cancelledCount}`, 14, yPos);
        yPos += 6;
        doc.text(`${t('reports.totalStudents')}: ${candidates.length}`, 14, yPos);
        yPos += 6;
        doc.text(`${t('reports.completionRate')}: ${filteredAppointments.length > 0 ? Math.round((completedAppointments.length / filteredAppointments.length) * 100) : 0}%`, 14, yPos);
        yPos += 10;
        
        // Student Performance
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(t('reports.studentPerformanceTitle'), 14, yPos);
        yPos += 8;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(t('reports.studentName'), 14, yPos);
        doc.text(t('candidates.clientNumberColumn'), 60, yPos);
        doc.text(t('instructors.totalLessons'), 110, yPos);
        doc.text(t('instructors.completedLessons'), 130, yPos);
        doc.text(t('candidates.completedHours'), 160, yPos);
        doc.text(t('common.status'), 185, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        
        candidateStats.forEach((stat) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(stat.name.substring(0, 20), 14, yPos);
          doc.text((stat.clientNumber || t('common.n/a' as any)).substring(0, 12), 60, yPos);
          doc.text(stat.totalLessons.toString(), 110, yPos);
          doc.text(stat.completedLessons.toString(), 130, yPos);
          doc.text(stat.hours.toString(), 160, yPos);
          doc.text(stat.status === 'active' ? t('common.active') : t('common.inactive'), 185, yPos);
          yPos += 6;
        });
        
        doc.save(`${t('reports.csvFilenameMyReports')}_${dateRange}_${timestamp}.pdf`);
        toast('success', t('reports.exportedToPDF'));
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast('error', t('myReports.failedToExport'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">{t('myReports.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('myReports.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('myReports.subtitle')}
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
            icon={<DownloadIcon className="w-4 h-4" />}
            onClick={handleExportReport}
          >
            {t('myReports.export')} {exportFormat.toUpperCase()}
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-40">
            <Input 
              label={t('reports.fromDate')} 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)} 
            />
          </div>
          <div className="w-40">
            <Input 
              label={t('reports.toDate')} 
              type="date" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)} 
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              {t('myReports.clear')}
            </Button>
          )}
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('myReports.totalLessons')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAppointments.length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <ClockIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('myReports.hoursTaught')}</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours}h</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <UsersIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('myReports.students')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {candidates.length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <TrendingUpIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('myReports.completionRate')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAppointments.length > 0 
                  ? Math.round((completedAppointments.length / filteredAppointments.length) * 100) 
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Student Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{t('myReports.studentPerformance')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable 
            data={candidateStats} 
            columns={candidateColumns} 
            keyExtractor={item => item.id} 
            searchable={false} 
            pagination={false} 
          />
        </CardContent>
      </Card>

      {/* Recent Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>{t('myReports.lessonHistory')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable 
            data={filteredAppointments.sort((a, b) => {
              const dateA = a.date?.split('T')[0] || a.date || '';
              const dateB = b.date?.split('T')[0] || b.date || '';
              return dateB.localeCompare(dateA);
            })} 
            columns={appointmentColumns} 
            keyExtractor={item => item._id || item.id || ''} 
            searchable={false} 
            pageSize={10} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
