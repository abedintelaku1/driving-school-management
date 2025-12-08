import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, EditIcon, MailIcon, PhoneIcon, MapPinIcon, CalendarIcon, CreditCardIcon, FileTextIcon, CheckCircleIcon, ClockIcon, XCircleIcon, UserIcon, CarIcon, PackageIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, StatusBadge, DocumentStatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs, TabList, Tab, TabPanel } from '../../components/ui/Tabs';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { getCandidateById, getPackageById, getInstructorById, getCarById, getPaymentsByCandidate, getAppointmentsByCandidate } from '../../utils/mockData';
import type { Payment, Appointment } from '../../types';
export function CandidateDetailPage() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const candidate = id ? getCandidateById(id) : null;
  if (!candidate) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <EmptyState title="Candidate not found" description="The candidate you're looking for doesn't exist or has been removed." action={{
        label: 'Back to Candidates',
        onClick: () => navigate('/admin/candidates')
      }} />
      </div>;
  }
  const pkg = candidate.packageId ? getPackageById(candidate.packageId) : null;
  const instructor = candidate.instructorId ? getInstructorById(candidate.instructorId) : null;
  const car = candidate.carId ? getCarById(candidate.carId) : null;
  const payments = getPaymentsByCandidate(candidate.id);
  const appointments = getAppointmentsByCandidate(candidate.id);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const packagePrice = pkg?.price || 0;
  const remainingBalance = packagePrice - totalPaid;
  const completedHours = appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.hours, 0);
  const totalHours = pkg?.numberOfHours || 0;
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/candidates')} icon={<ArrowLeftIcon className="w-4 h-4" />}>
          Back
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <p className="text-gray-500">{candidate.uniqueClientNumber}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={candidate.status} />
                <Button variant="outline" icon={<EditIcon className="w-4 h-4" />}>
                  Edit
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3 text-gray-600">
                <MailIcon className="w-5 h-5 text-gray-400" />
                <span>{candidate.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <span>{candidate.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <span>DOB: {candidate.dateOfBirth}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 md:col-span-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span>{candidate.address}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <PackageIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Package</p>
              <p className="font-semibold text-gray-900">
                {pkg?.name || 'Not assigned'}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <UserIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Instructor</p>
              <p className="font-semibold text-gray-900">
                {instructor ? `${instructor.firstName} ${instructor.lastName}` : 'Not assigned'}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hours Completed</p>
              <p className="font-semibold text-gray-900">
                {completedHours} / {totalHours}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <CreditCardIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p className={`font-semibold ${remainingBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                ${remainingBalance > 0 ? remainingBalance : 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultTab="documents">
        <TabList>
          <Tab value="documents">Documents</Tab>
          <Tab value="payments">Payments</Tab>
          <Tab value="appointments">Appointments</Tab>
        </TabList>

        <TabPanel value="documents">
          <DocumentsTab documents={candidate.documents} />
        </TabPanel>

        <TabPanel value="payments">
          <PaymentsTab payments={payments} packagePrice={packagePrice} />
        </TabPanel>

        <TabPanel value="appointments">
          <AppointmentsTab appointments={appointments} />
        </TabPanel>
      </Tabs>
    </div>;
}
function DocumentsTab({
  documents
}: {
  documents: (typeof mockCandidates)[0]['documents'];
}) {
  const statusIcons = {
    pending: <ClockIcon className="w-5 h-5 text-gray-400" />,
    submitted: <FileTextIcon className="w-5 h-5 text-blue-500" />,
    approved: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
    rejected: <XCircleIcon className="w-5 h-5 text-red-500" />
  };
  return <Card>
      <CardHeader>
        <CardTitle>Required Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map(doc => <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {statusIcons[doc.status]}
                <div>
                  <p className="font-medium text-gray-900">{doc.name}</p>
                  {doc.submittedAt && <p className="text-sm text-gray-500">
                      Submitted: {doc.submittedAt}
                    </p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DocumentStatusBadge status={doc.status} />
                <Button variant="ghost" size="sm">
                  {doc.status === 'pending' ? 'Upload' : 'View'}
                </Button>
              </div>
            </div>)}
        </div>
      </CardContent>
    </Card>;
}
function PaymentsTab({
  payments,
  packagePrice
}: {
  payments: Payment[];
  packagePrice: number;
}) {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const columns = [{
    key: 'date',
    label: 'Date',
    sortable: true
  }, {
    key: 'amount',
    label: 'Amount',
    render: (value: unknown) => <span className="font-semibold text-gray-900">${value as number}</span>
  }, {
    key: 'method',
    label: 'Method',
    render: (value: unknown) => <Badge variant="outline">
          {(value as string).charAt(0).toUpperCase() + (value as string).slice(1)}
        </Badge>
  }, {
    key: 'notes',
    label: 'Notes',
    render: (value: unknown) => <span className="text-gray-500">{value as string || '-'}</span>
  }];
  return <div className="space-y-4">
      {/* Summary */}
      <Card className="bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-gray-900">${totalPaid}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Package Price</p>
            <p className="text-2xl font-bold text-gray-900">${packagePrice}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Remaining</p>
            <p className={`text-2xl font-bold ${packagePrice - totalPaid > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              ${Math.max(0, packagePrice - totalPaid)}
            </p>
          </div>
          <Button>Record Payment</Button>
        </div>
      </Card>

      {/* Payments Table */}
      <Card padding="none">
        <DataTable data={payments} columns={columns} keyExtractor={p => p.id} searchable={false} pagination={false} emptyMessage="No payments recorded" />
      </Card>
    </div>;
}
function AppointmentsTab({
  appointments
}: {
  appointments: Appointment[];
}) {
  const columns = [{
    key: 'date',
    label: 'Date',
    sortable: true
  }, {
    key: 'time',
    label: 'Time',
    render: (_: unknown, appointment: Appointment) => <span>
          {appointment.startTime} - {appointment.endTime}
        </span>
  }, {
    key: 'hours',
    label: 'Hours'
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
      return <Badge variant={variants[status]} dot>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>;
    }
  }, {
    key: 'notes',
    label: 'Notes',
    render: (value: unknown) => <span className="text-gray-500">{value as string || '-'}</span>
  }];
  return <Card padding="none">
      <DataTable data={appointments} columns={columns} keyExtractor={a => a.id} searchable={false} emptyMessage="No appointments scheduled" />
    </Card>;
}
// Import mock data for type reference
import { mockCandidates } from '../../utils/mockData';