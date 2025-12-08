import React, { useState } from 'react';
import { DownloadIcon, FilterIcon, UsersIcon, CarIcon, CreditCardIcon, CalendarIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Tabs, TabList, Tab, TabPanel } from '../../components/ui/Tabs';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { mockCandidates, mockCars, mockInstructors, mockPayments, mockAppointments, getInstructorById, getCandidateById } from '../../utils/mockData';
export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // Calculate stats
  const totalCandidates = mockCandidates.length;
  const activeCandidates = mockCandidates.filter(c => c.status === 'active').length;
  const totalRevenue = mockPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalHours = mockAppointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.hours, 0);
  return <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">
            View and export reports for all entities.
          </p>
        </div>
        <Button variant="outline" icon={<DownloadIcon className="w-4 h-4" />}>
          Export All
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCandidates}
              </p>
              <p className="text-xs text-green-600">
                {activeCandidates} active
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CreditCardIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {mockPayments.length} transactions
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hours Taught</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours}h</p>
              <p className="text-xs text-gray-500">
                {mockAppointments.filter(a => a.status === 'completed').length}{' '}
                lessons
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <CarIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Cars</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockCars.filter(c => c.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500">
                of {mockCars.length} total
              </p>
            </div>
          </div>
        </Card>
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
          <Button variant="secondary" icon={<FilterIcon className="w-4 h-4" />}>
            Apply Filter
          </Button>
        </div>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultTab="instructors">
        <TabList>
          <Tab value="instructors">Instructor Performance</Tab>
          <Tab value="candidates">Candidate Progress</Tab>
          <Tab value="cars">Car Usage</Tab>
          <Tab value="payments">Payment Summary</Tab>
        </TabList>

        <TabPanel value="instructors">
          <InstructorPerformanceReport />
        </TabPanel>

        <TabPanel value="candidates">
          <CandidateProgressReport />
        </TabPanel>

        <TabPanel value="cars">
          <CarUsageReport />
        </TabPanel>

        <TabPanel value="payments">
          <PaymentSummaryReport />
        </TabPanel>
      </Tabs>
    </div>;
}
function InstructorPerformanceReport() {
  const instructorStats = mockInstructors.map(instructor => {
    const appointments = mockAppointments.filter(a => a.instructorId === instructor.id);
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const totalHours = completedAppointments.reduce((sum, a) => sum + a.hours, 0);
    const candidates = mockCandidates.filter(c => c.instructorId === instructor.id);
    return {
      id: instructor.id,
      name: `${instructor.firstName} ${instructor.lastName}`,
      totalHours,
      completedLessons: completedAppointments.length,
      activeCandidates: candidates.filter(c => c.status === 'active').length,
      totalCandidates: candidates.length,
      status: instructor.status
    };
  });
  const columns = [{
    key: 'name',
    label: 'Instructor',
    sortable: true
  }, {
    key: 'totalHours',
    label: 'Hours Taught',
    sortable: true,
    render: (value: unknown) => <span className="font-semibold">{value as number}h</span>
  }, {
    key: 'completedLessons',
    label: 'Lessons',
    sortable: true
  }, {
    key: 'activeCandidates',
    label: 'Active Students',
    sortable: true
  }, {
    key: 'totalCandidates',
    label: 'Total Students',
    sortable: true
  }, {
    key: 'status',
    label: 'Status',
    render: (value: unknown) => <Badge variant={value === 'active' ? 'success' : 'danger'} dot>
          {value as string}
        </Badge>
  }];
  return <Card padding="none">
      <DataTable data={instructorStats} columns={columns} keyExtractor={item => item.id} searchable={false} pagination={false} />
    </Card>;
}
function CandidateProgressReport() {
  const candidateStats = mockCandidates.map(candidate => {
    const appointments = mockAppointments.filter(a => a.candidateId === candidate.id);
    const completedHours = appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.hours, 0);
    const payments = mockPayments.filter(p => p.candidateId === candidate.id);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      id: candidate.id,
      name: `${candidate.firstName} ${candidate.lastName}`,
      clientNumber: candidate.uniqueClientNumber,
      completedHours,
      scheduledLessons: appointments.filter(a => a.status === 'scheduled').length,
      totalPaid,
      status: candidate.status
    };
  });
  const columns = [{
    key: 'name',
    label: 'Candidate',
    sortable: true,
    render: (_: unknown, item: (typeof candidateStats)[0]) => <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-gray-500">{item.clientNumber}</p>
        </div>
  }, {
    key: 'completedHours',
    label: 'Hours Completed',
    sortable: true,
    render: (value: unknown) => <span className="font-semibold">{value as number}h</span>
  }, {
    key: 'scheduledLessons',
    label: 'Scheduled',
    sortable: true
  }, {
    key: 'totalPaid',
    label: 'Total Paid',
    sortable: true,
    render: (value: unknown) => <span className="font-semibold">${value as number}</span>
  }, {
    key: 'status',
    label: 'Status',
    render: (value: unknown) => <Badge variant={value === 'active' ? 'success' : 'danger'} dot>
          {value as string}
        </Badge>
  }];
  return <Card padding="none">
      <DataTable data={candidateStats} columns={columns} keyExtractor={item => item.id} searchable searchPlaceholder="Search candidates..." searchKeys={['name', 'clientNumber']} />
    </Card>;
}
function CarUsageReport() {
  const carStats = mockCars.map(car => {
    const appointments = mockAppointments.filter(a => a.carId === car.id);
    const usageHours = appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.hours, 0);
    return {
      id: car.id,
      model: car.model,
      licensePlate: car.licensePlate,
      totalHours: car.totalHours,
      recentUsage: usageHours,
      nextInspection: car.nextInspection,
      status: car.status
    };
  });
  const columns = [{
    key: 'model',
    label: 'Vehicle',
    sortable: true,
    render: (_: unknown, item: (typeof carStats)[0]) => <div>
          <p className="font-medium">{item.model}</p>
          <p className="text-sm text-gray-500 font-mono">{item.licensePlate}</p>
        </div>
  }, {
    key: 'totalHours',
    label: 'Total Hours',
    sortable: true,
    render: (value: unknown) => <span className="font-semibold">{value as number}h</span>
  }, {
    key: 'recentUsage',
    label: 'Recent Usage',
    sortable: true,
    render: (value: unknown) => <span>{value as number}h</span>
  }, {
    key: 'nextInspection',
    label: 'Next Inspection',
    sortable: true
  }, {
    key: 'status',
    label: 'Status',
    render: (value: unknown) => <Badge variant={value === 'active' ? 'success' : 'danger'} dot>
          {value as string}
        </Badge>
  }];
  return <Card padding="none">
      <DataTable data={carStats} columns={columns} keyExtractor={item => item.id} searchable={false} pagination={false} />
    </Card>;
}
function PaymentSummaryReport() {
  // Group payments by month
  const paymentsByMonth: Record<string, {
    total: number;
    count: number;
    bank: number;
    cash: number;
  }> = {};
  mockPayments.forEach(payment => {
    const month = payment.date.substring(0, 7); // YYYY-MM
    if (!paymentsByMonth[month]) {
      paymentsByMonth[month] = {
        total: 0,
        count: 0,
        bank: 0,
        cash: 0
      };
    }
    paymentsByMonth[month].total += payment.amount;
    paymentsByMonth[month].count += 1;
    paymentsByMonth[month][payment.method] += payment.amount;
  });
  const monthlyData = Object.entries(paymentsByMonth).map(([month, data]) => ({
    id: month,
    month,
    ...data
  })).sort((a, b) => b.month.localeCompare(a.month));
  const columns = [{
    key: 'month',
    label: 'Month',
    sortable: true,
    render: (value: unknown) => {
      const date = new Date((value as string) + '-01');
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    }
  }, {
    key: 'total',
    label: 'Total',
    sortable: true,
    render: (value: unknown) => <span className="font-semibold text-green-600">${value as number}</span>
  }, {
    key: 'count',
    label: 'Transactions',
    sortable: true
  }, {
    key: 'bank',
    label: 'Bank',
    render: (value: unknown) => <span>${value as number}</span>
  }, {
    key: 'cash',
    label: 'Cash',
    render: (value: unknown) => <span>${value as number}</span>
  }];
  return <Card padding="none">
      <DataTable data={monthlyData} columns={columns} keyExtractor={item => item.id} searchable={false} pagination={false} />
    </Card>;
}