import React, { useEffect, useMemo, useState } from 'react';
import { MailIcon, PhoneIcon, ClockIcon, CalendarIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';
import type { Candidate } from '../../types';
export function MyCandidatesPage() {
  const {
    user
  } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { ok, data } = await api.listCandidates();
      if (ok && data) {
        setCandidates(data as Candidate[]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const myCandidates = useMemo(() => candidates, [candidates]);
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
        const progress = 0;
        const scheduledLessons = 0;
        const candidateId = (candidate as any)._id || candidate.id;
        return <Card key={candidateId}>
              <div className="flex items-start gap-4">
                <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {candidate.firstName} {candidate.lastName}
                      </h3>
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

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                        Package / Hours
                        </span>
                        <Badge variant="info" size="sm">
                        Assigned
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{progress}% complete</span>
                        <span>{scheduledLessons} scheduled</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all" style={{
                      width: `${progress}%`
                    }} />
                        </div>
                        </div>
                      </div>

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
            <p className="text-gray-500">{loading ? 'Loading...' : 'No students assigned to you yet.'}</p>
          </div>
        </Card>}
    </div>;
}