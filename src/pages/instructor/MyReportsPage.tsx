import React, { useState } from 'react';
import { DownloadIcon, CalendarIcon, ClockIcon, UsersIcon, TrendingUpIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { getAppointmentsByInstructor, getCandidatesByInstructor, getCandidateById, mockAppointments } from '../../utils/mockData';
export function MyReportsPage() {
  const {
    user
  } = useAuth();
  const instructorId = user?.id || '2';
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const myAppointments = getAppointmentsByInstructor(instructorId);
  const myCandidates = getCandidatesByInstructor(instructorId);
  // Filter appointments by date range
  const filteredAppointments = myAppointments.filter(a => {
    if (dateFrom && a.date < dateFrom) return false;
    if (dateTo && a.date > dateTo) return false;
    return true;
  });
  const completedAppointments = filteredAppointments.filter(a => a.status === 'completed');
  const totalHours = completedAppointments.reduce((sum, a) => sum + a.hours, 0);
  const cancelledCount = filteredAppointments.filter(a => a.status === 'cancelled').length;
  // Calculate stats by candidate
  const candidateStats = myCandidates.map(candidate => {
    const candidateAppointments = filteredAppointments.filter(a => a.candidateId === candidate.id);
    const completed = candidateAppointments.filter(a => a.status === 'completed');
    const hours = completed.reduce((sum, a) => sum + a.hours, 0);
    return {
      id: candidate.id,
      name: `${candidate.firstName} ${candidate.lastName}`,
      clientNumber: candidate.uniqueClientNumber,
      totalLessons: candidateAppointments.length,
      completedLessons: completed.length,
      hours,
      status: candidate.status
    };
  });
  const appointmentColumns = [{
    key: 'date',
    label: 'Date',
    sortable: true
  }, {
    key: 'time',
    label: 'Time',
    render: (_: unknown, apt: (typeof myAppointments)[0]) => <span>
          {apt.startTime} - {apt.endTime}
        </span>
  }, {
    key: 'candidateId',
    label: 'Student',
    render: (value: unknown) => {
      const candidate = getCandidateById(value as string);
      return candidate ? `${candidate.firstName} ${candidate.lastName}` : '-';
    }
  }, {
    key: 'hours',
    label: 'Hours',
    render: (value: unknown) => <span className="font-semibold">{value as number}h</span>
  }, {
    key: 'status',
    label: 'Status',
    render: (value: unknown) => {
      const status = value as string;
      const variants: Record<string, 'success' | 'warning' | 'danger'> = {
        completed: 'success',
        scheduled: 'warning',
        cancelled: 'danger'
      };
      return <Badge variant={variants[status]} size="sm">
            {status}
          </Badge>;
    }
  }];
  const candidateColumns = [{
    key: 'name',
    label: 'Student',
    sortable: true,
    render: (_: unknown, item: (typeof candidateStats)[0]) => <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-gray-500">{item.clientNumber}</p>
        </div>
  }, {
    key: 'completedLessons',
    label: 'Completed',
    sortable: true
  }, {
    key: 'totalLessons',
    label: 'Total Lessons',
    sortable: true
  }, {
    key: 'hours',
    label: 'Hours',
    sortable: true,
    render: (value: unknown) => <span className="font-semibold">{value as number}h</span>
  }, {
    key: 'status',
    label: 'Status',
    render: (value: unknown) => <Badge variant={value === 'active' ? 'success' : 'danger'} dot size="sm">
          {value as string}
        </Badge>
  }];
  return <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-500 mt-1">
            View your teaching statistics and performance.
          </p>
        </div>
        <Button variant="outline" icon={<DownloadIcon className="w-4 h-4" />}>
          Export Report
        </Button>
      </div>

      {/* Date Filter */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-40">
            <Input label="From Date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="w-40">
            <Input label="To Date" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo) && <Button variant="ghost" size="sm" onClick={() => {
          setDateFrom('');
          setDateTo('');
        }}>
              Clear
            </Button>}
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
                {myCandidates.length}
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
                {filteredAppointments.length > 0 ? Math.round(completedAppointments.length / filteredAppointments.length * 100) : 0}
                %
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
          <DataTable data={candidateStats} columns={candidateColumns} keyExtractor={item => item.id} searchable={false} pagination={false} />
        </CardContent>
      </Card>

      {/* Recent Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable data={filteredAppointments.sort((a, b) => b.date.localeCompare(a.date))} columns={appointmentColumns} keyExtractor={item => item.id} searchable={false} pageSize={10} />
        </CardContent>
      </Card>
    </div>;
}