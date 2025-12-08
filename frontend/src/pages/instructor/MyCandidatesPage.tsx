import React from 'react';
import { MailIcon, PhoneIcon, ClockIcon, CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { getCandidatesByInstructor, getPackageById, mockAppointments } from '../../utils/mockData';
export function MyCandidatesPage() {
  const {
    user
  } = useAuth();
  const instructorId = user?.id || '2';
  const myCandidates = getCandidatesByInstructor(instructorId);
  return <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-500 mt-1">
          View and track your assigned students' progress.
        </p>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {myCandidates.map(candidate => {
        const pkg = candidate.packageId ? getPackageById(candidate.packageId) : null;
        const appointments = mockAppointments.filter(a => a.candidateId === candidate.id);
        const completedHours = appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.hours, 0);
        const scheduledLessons = appointments.filter(a => a.status === 'scheduled').length;
        const totalHours = pkg?.numberOfHours || 0;
        const progress = totalHours > 0 ? Math.round(completedHours / totalHours * 100) : 0;
        return <Card key={candidate.id}>
              <div className="flex items-start gap-4">
                <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {candidate.firstName} {candidate.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {candidate.uniqueClientNumber}
                      </p>
                    </div>
                    <StatusBadge status={candidate.status} />
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MailIcon className="w-4 h-4 text-gray-400" />
                      <span>{candidate.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                      <span>{candidate.phone}</span>
                    </div>
                  </div>

                  {pkg && <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {pkg.name}
                        </span>
                        <Badge variant="info" size="sm">
                          {pkg.category}
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{completedHours}h completed</span>
                          <span>{totalHours}h total</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all" style={{
                      width: `${progress}%`
                    }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <ClockIcon className="w-4 h-4" />
                          <span>{progress}% complete</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{scheduledLessons} scheduled</span>
                        </div>
                      </div>
                    </div>}

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" fullWidth>
                      View Details
                    </Button>
                    <Button size="sm" fullWidth>
                      Schedule Lesson
                    </Button>
                  </div>
                </div>
              </div>
            </Card>;
      })}
      </div>

      {myCandidates.length === 0 && <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No students assigned to you yet.</p>
          </div>
        </Card>}
    </div>;
}