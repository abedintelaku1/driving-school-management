import React, { useState, useEffect, useMemo } from 'react';
import { DownloadIcon, CalendarIcon, ClockIcon, UsersIcon, TrendingUpIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';
import { toast } from '../../hooks/useToast';

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
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
          toast('error', 'Failed to load appointments');
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
          toast('error', 'Failed to load candidates');
        }
      } catch (error) {
        console.error('Error fetching reports data:', error);
        toast('error', 'Failed to load reports data');
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
      label: 'Date',
      sortable: true
    },
    {
      key: 'time',
      label: 'Time',
      render: (_: unknown, apt: Appointment) => (
        <span>
          {apt.startTime} - {apt.endTime}
        </span>
      )
    },
    {
      key: 'candidateId',
      label: 'Student',
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
      label: 'Hours',
      render: (value: unknown) => (
        <span className="font-semibold">{value as number}h</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => {
        const status = value as string;
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
          completed: 'success',
          scheduled: 'warning',
          cancelled: 'danger'
        };
        return (
          <Badge variant={variants[status] || 'warning'} size="sm">
            {status}
          </Badge>
        );
      }
    }
  ];

  const candidateColumns = [
    {
      key: 'name',
      label: 'Student',
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
      label: 'Completed',
      sortable: true
    },
    {
      key: 'totalLessons',
      label: 'Total Lessons',
      sortable: true
    },
    {
      key: 'hours',
      label: 'Hours',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{value as number}h</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => (
        <Badge variant={value === 'active' ? 'success' : 'danger'} dot size="sm">
          {value as string}
        </Badge>
      )
    }
  ];

  // Export report to CSV
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
      const filename = `instructor_reports_${dateRange}_${timestamp}.csv`;

      let csvContent = 'Instructor Reports Export\n';
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      if (dateFrom || dateTo) {
        csvContent += `Date Range: ${dateFrom || 'All'} to ${dateTo || 'All'}\n`;
      }
      csvContent += '\n';

      // 1. Summary Statistics
      csvContent += '=== SUMMARY STATISTICS ===\n';
      csvContent += `Metric,Value\n`;
      csvContent += `Total Lessons,${filteredAppointments.length}\n`;
      csvContent += `Completed Lessons,${completedAppointments.length}\n`;
      csvContent += `Hours Taught,${totalHours}h\n`;
      csvContent += `Cancelled Lessons,${cancelledCount}\n`;
      csvContent += `Total Students,${candidates.length}\n`;
      csvContent += `Completion Rate,${filteredAppointments.length > 0 ? Math.round((completedAppointments.length / filteredAppointments.length) * 100) : 0}%\n`;
      csvContent += '\n';

      // 2. Student Performance
      csvContent += '=== STUDENT PERFORMANCE ===\n';
      csvContent += 'Student Name,Client Number,Total Lessons,Completed Lessons,Hours Completed,Status\n';
      candidateStats.forEach(stat => {
        csvContent += `"${stat.name}","${stat.clientNumber || ''}",${stat.totalLessons},${stat.completedLessons},${stat.hours},${stat.status}\n`;
      });
      csvContent += '\n';

      // 3. Lesson History
      csvContent += '=== LESSON HISTORY ===\n';
      csvContent += 'Date,Time,Student,Hours,Status\n';
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
          csvContent += `"${apt.date?.split('T')[0] || apt.date || ''}","${apt.startTime || ''} - ${apt.endTime || ''}","${studentName}",${apt.hours || 0},${apt.status}\n`;
        });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast('success', 'Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast('error', 'Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-500 mt-1">
            View your teaching statistics and performance.
          </p>
        </div>
        <Button 
          variant="outline" 
          icon={<DownloadIcon className="w-4 h-4" />}
          onClick={handleExportReport}
        >
          Export Report
        </Button>
      </div>

      {/* Date Filter */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-40">
            <Input 
              label="From Date" 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)} 
            />
          </div>
          <div className="w-40">
            <Input 
              label="To Date" 
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
              Clear
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
              <p className="text-sm text-gray-500">Total Lessons</p>
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
              <p className="text-sm text-gray-500">Hours Taught</p>
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
              <p className="text-sm text-gray-500">Students</p>
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
              <p className="text-sm text-gray-500">Completion Rate</p>
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
          <CardTitle>Student Performance</CardTitle>
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
          <CardTitle>Lesson History</CardTitle>
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
