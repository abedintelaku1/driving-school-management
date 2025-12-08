import React from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, CarIcon, GraduationCapIcon, CreditCardIcon, CalendarIcon, AlertCircleIcon, ArrowRightIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/ui/StatCard';
import { mockCandidates, mockCars, mockInstructors, mockPayments, mockAppointments, getPackageById, getInstructorById } from '../../utils/mockData';
export function AdminDashboard() {
  const activeCandidates = mockCandidates.filter(c => c.status === 'active').length;
  const activeCars = mockCars.filter(c => c.status === 'active').length;
  const activeInstructors = mockInstructors.filter(i => i.status === 'active').length;
  const totalRevenue = mockPayments.reduce((sum, p) => sum + p.amount, 0);
  const recentCandidates = [...mockCandidates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const upcomingAppointments = mockAppointments.filter(a => a.status === 'scheduled').slice(0, 5);
  const carsNeedingAttention = mockCars.filter(car => {
    const nextInspection = new Date(car.nextInspection);
    const daysUntilInspection = Math.ceil((nextInspection.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilInspection <= 30;
  });
  return <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-sm lg:text-base text-gray-500 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard title="Active Candidates" value={activeCandidates} change="+12% from last month" changeType="positive" icon={<UsersIcon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />} link="/admin/candidates" />
        <StatCard title="Active Cars" value={activeCars} icon={<CarIcon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />} link="/admin/cars" />
        <StatCard title="Active Instructors" value={activeInstructors} icon={<GraduationCapIcon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />} link="/admin/instructors" />
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="+8% from last month" changeType="positive" icon={<CreditCardIcon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />} link="/admin/payments" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Candidates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Candidates</CardTitle>
              <Link to="/admin/candidates" className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                View all <ArrowRightIcon className="w-3 h-3 lg:w-4 lg:h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 lg:space-y-4">
              {recentCandidates.map(candidate => {
              const pkg = candidate.packageId ? getPackageById(candidate.packageId) : null;
              return <Link key={candidate.id} to={`/admin/candidates/${candidate.id}`} className="flex items-center gap-3 lg:gap-4 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm lg:text-base text-gray-900 truncate">
                        {candidate.firstName} {candidate.lastName}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500">
                        {candidate.uniqueClientNumber}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {pkg && <p className="text-xs lg:text-sm font-medium text-gray-700 hidden sm:block">
                          {pkg.name}
                        </p>}
                      <Badge variant={candidate.status === 'active' ? 'success' : 'danger'} dot>
                        {candidate.status}
                      </Badge>
                    </div>
                  </Link>;
            })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Appointments</CardTitle>
              <Link to="/admin/reports" className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                View all <ArrowRightIcon className="w-3 h-3 lg:w-4 lg:h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 lg:space-y-4">
              {upcomingAppointments.map(appointment => {
              const instructor = getInstructorById(appointment.instructorId);
              const candidate = mockCandidates.find(c => c.id === appointment.candidateId);
              return <div key={appointment.id} className="flex items-center gap-3 lg:gap-4 p-3 rounded-lg bg-gray-50">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <CalendarIcon className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm lg:text-base text-gray-900 truncate">
                        {candidate?.firstName} {candidate?.lastName}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500 truncate">
                        with {instructor?.firstName} {instructor?.lastName}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs lg:text-sm font-medium text-gray-900">
                        {appointment.date}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                    </div>
                  </div>;
            })}
              {upcomingAppointments.length === 0 && <p className="text-center text-sm text-gray-500 py-4">
                  No upcoming appointments
                </p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {carsNeedingAttention.length > 0 && <Card className="border-amber-200 bg-amber-50">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
              <AlertCircleIcon className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm lg:text-base text-amber-800">
                Attention Required
              </h3>
              <p className="text-xs lg:text-sm text-amber-700 mt-1">
                {carsNeedingAttention.length} car(s) need inspection within the
                next 30 days.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {carsNeedingAttention.map(car => <Link key={car.id} to="/admin/cars" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-xs lg:text-sm font-medium text-amber-800 hover:bg-amber-100 active:bg-amber-200 transition-colors">
                    <CarIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden sm:inline">{car.model} </span>(
                    {car.licensePlate})
                  </Link>)}
              </div>
            </div>
          </div>
        </Card>}
    </div>;
}