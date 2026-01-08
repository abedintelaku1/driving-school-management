import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UsersIcon, TrendingUpIcon, ArrowRightIcon, CheckCircleIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';

type Appointment = {
  _id?: string;
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  hours?: number;
  status: string;
  candidate?: any;
  candidateId?: string;
  carId?: any;
};

type Candidate = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  status?: string;
};

export function InstructorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructorId, setInstructorId] = useState<string | null>(null);

  // Get instructor ID
  useEffect(() => {
    const fetchInstructorId = async () => {
      if (user?.role === 1) {
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
      if (user?.role === 1 && !instructorId) {
        return; // Wait for instructorId
      }

      setLoading(true);
      try {
        let appointmentsRes;
        let candidatesRes;
        let carsRes;

        if (user?.role === 1 && instructorId) {
          // Fetch appointments for this instructor
          const instructorAppointmentsRes = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/instructor/${instructorId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            }
          );
          const instructorAppointmentsData = await instructorAppointmentsRes.json();
          appointmentsRes = { ok: instructorAppointmentsRes.ok, data: instructorAppointmentsData };

          // Fetch candidates assigned to this instructor
          candidatesRes = await api.listCandidates();
          if (candidatesRes.ok && candidatesRes.data) {
            const filteredCandidates = candidatesRes.data.filter((c: any) => {
              const candInstructorId = c.instructorId?._id || c.instructorId || c.instructor?._id || c.instructor?.id || c.instructorId;
              return candInstructorId === instructorId;
            });
            candidatesRes.data = filteredCandidates;
          }

          // Fetch assigned cars
          carsRes = await api.getMyCars();
        } else {
          appointmentsRes = { ok: false, data: [] };
          candidatesRes = { ok: false, data: [] };
          carsRes = { ok: false, data: [] };
        }

        if (appointmentsRes.ok && appointmentsRes.data) {
          const mapped = (appointmentsRes.data as any[]).map((item) => ({
            _id: item._id || item.id,
            id: item._id || item.id,
            date: item.date ? (item.date.split('T')[0] || item.date) : '',
            startTime: item.startTime || '',
            endTime: item.endTime || '',
            hours: item.hours || 0,
            status: item.status || 'scheduled',
            candidate: item.candidateId || item.candidate,
            candidateId: item.candidateId?._id || item.candidateId || item.candidate?._id || item.candidate?.id || '',
            carId: item.carId || item.car,
          }));
          setAppointments(mapped);
        }

        if (candidatesRes.ok && candidatesRes.data) {
          const mapped = (candidatesRes.data as any[]).map((item) => ({
            _id: item._id || item.id,
            id: item._id || item.id,
            firstName: item.firstName || '',
            lastName: item.lastName || '',
            status: item.status || 'active',
          }));
          setCandidates(mapped);
        }

        if (carsRes?.ok && carsRes.data) {
          const mapped = (carsRes.data as any[]).map((item) => ({
            _id: item._id || item.id,
            id: item._id || item.id,
            model: item.model || '',
            licensePlate: item.licensePlate || '',
          }));
          setCars(mapped);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, instructorId]);

  const today = new Date().toISOString().split('T')[0];
  
  const todayAppointments = useMemo(() => {
    return appointments.filter(a => {
      const aptDate = a.date?.split('T')[0] || a.date;
      return aptDate === today && a.status === 'scheduled';
    });
  }, [appointments, today]);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        const aptDate = a.date?.split('T')[0] || a.date;
        return aptDate >= today && a.status === 'scheduled';
      })
      .sort((a, b) => {
        const dateA = a.date?.split('T')[0] || a.date;
        const dateB = b.date?.split('T')[0] || b.date;
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.startTime || '').localeCompare(b.startTime || '');
      })
      .slice(0, 5);
  }, [appointments, today]);

  const completedThisMonth = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    return appointments.filter(a => {
      const aptDate = a.date?.split('T')[0] || a.date;
      const appointmentMonth = aptDate?.substring(0, 7);
      return appointmentMonth === currentMonth && a.status === 'completed';
    });
  }, [appointments]);

  const hoursThisMonth = useMemo(() => {
    return completedThisMonth.reduce((sum, a) => sum + (a.hours || 0), 0);
  }, [completedThisMonth]);

  const activeCandidates = useMemo(() => {
    return candidates.filter(c => !c.status || c.status === 'active');
  }, [candidates]);

  const getCandidateById = (id: string) => {
    return candidates.find(c => (c._id || c.id) === id);
  };

  const getCarById = (id: string) => {
    if (!id) return null;
    return cars.find(c => {
      const carId = c._id || c.id;
      return carId === id;
    });
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'Instructor'}!
          </h1>
          <p className="text-gray-500 mt-1">
            {todayAppointments.length > 0 ? `You have ${todayAppointments.length} appointment${todayAppointments.length > 1 ? 's' : ''} today.` : 'No appointments scheduled for today.'}
          </p>
        </div>
        <Link to="/instructor/appointments">
          <Button icon={<CalendarIcon className="w-4 h-4" />}>
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Lessons</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayAppointments.length}
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
              <p className="text-sm text-gray-500">Hours This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {hoursThisMonth}h
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <UsersIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeCandidates.length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <CheckCircleIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedThisMonth.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Schedule</CardTitle>
              <Link to="/instructor/calendar" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View Calendar <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map(appointment => {
                  const candidateId = appointment.candidateId || appointment.candidate?._id || appointment.candidate?.id || '';
                  const candidate = candidateId ? getCandidateById(candidateId) : appointment.candidate;
                  const carId = appointment.carId?._id || appointment.carId?.id || appointment.carId || '';
                  const car = carId ? getCarById(carId) : appointment.carId || appointment.car;
                  const aptId = appointment._id || appointment.id || '';
                  
                  return (
                    <div key={aptId} className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold text-blue-600">
                          {appointment.startTime}
                        </p>
                        <p className="text-xs text-blue-500">
                          {appointment.hours || 0}h
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {candidate?.firstName || appointment.candidate?.firstName} {candidate?.lastName || appointment.candidate?.lastName}
                        </p>
                        {car && (
                          <p className="text-sm text-gray-500">
                            {car.model || appointment.carId?.model || appointment.car?.model} • {car.licensePlate || appointment.carId?.licensePlate || appointment.car?.licensePlate}
                          </p>
                        )}
                      </div>
                      <Badge variant="info">Scheduled</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No lessons scheduled for today</p>
                <Link to="/instructor/appointments">
                  <Button variant="outline" size="sm" className="mt-3">
                    Schedule a Lesson
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Appointments</CardTitle>
              <Link to="/instructor/appointments" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map(appointment => {
                  const candidateId = appointment.candidateId || appointment.candidate?._id || appointment.candidate?.id || '';
                  const candidate = candidateId ? getCandidateById(candidateId) : appointment.candidate;
                  const aptId = appointment._id || appointment.id || '';
                  const aptDate = appointment.date?.split('T')[0] || appointment.date;
                  
                  return (
                    <div key={aptId} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <Avatar name={`${candidate?.firstName || appointment.candidate?.firstName || ''} ${candidate?.lastName || appointment.candidate?.lastName || ''}`} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {candidate?.firstName || appointment.candidate?.firstName} {candidate?.lastName || appointment.candidate?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.startTime} - {appointment.endTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {aptDate}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.hours || 0}h
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No upcoming appointments
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Students */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Students</CardTitle>
            <Link to="/instructor/candidates" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activeCandidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCandidates.slice(0, 6).map(candidate => {
                const candidateId = candidate._id || candidate.id || '';
                const candidateAppointments = appointments.filter(a => {
                  const aptCandidateId = a.candidate?._id || a.candidate?.id || a.candidateId;
                  return aptCandidateId === candidateId;
                });
                const completedHours = candidateAppointments
                  .filter(a => a.status === 'completed')
                  .reduce((sum, a) => sum + (a.hours || 0), 0);
                
                return (
                  <div key={candidateId} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {candidate.firstName} {candidate.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {completedHours}h completed
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No active students
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}