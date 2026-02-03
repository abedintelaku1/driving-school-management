import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';
import type { Appointment } from '../../types';
const DAYS = ['Dië', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'];
const MONTHS = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
type AppointmentEx = Appointment & {
  _id?: string;
  candidate?: any;
  carId?: any;
};

export function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentEx[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
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

  // Fetch appointments, candidates, and cars
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
            `${import.meta.env.VITE_API_URL || ''}/api/appointments/instructor/${instructorId}`,
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
            id: item._id || item.id,
            date: item.date ? (item.date.split('T')[0] || item.date) : '',
            startTime: item.startTime || '',
            endTime: item.endTime || '',
            hours: item.hours || 0,
            status: item.status || 'scheduled',
            notes: item.notes || '',
            candidateId: item.candidateId?._id || item.candidateId || item.candidate?._id || item.candidate?.id || '',
            candidate: item.candidateId || item.candidate,
            carId: item.carId?._id || item.carId || item.car?.id || '',
            car: item.carId || item.car,
          }));
          setAppointments(mapped);
        }

        if (candidatesRes.ok && candidatesRes.data) {
          const mapped = (candidatesRes.data as any[]).map((item) => ({
            id: item._id || item.id,
            firstName: item.firstName || '',
            lastName: item.lastName || '',
          }));
          setCandidates(mapped);
        }

        if (carsRes?.ok && carsRes.data) {
          const mapped = (carsRes.data as any[]).map((item) => ({
            id: item._id || item.id,
            model: item.model || '',
            licensePlate: item.licensePlate || '',
          }));
          setCars(mapped);
        }
      } catch (error) {
        console.error('Failed to load calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, instructorId]);

  const getCandidateById = (id: string) => {
    return candidates.find(c => (c._id || c.id) === id);
  };

  const getCarById = (id: string) => {
    return cars.find(c => (c._id || c.id) === id);
  };

  const myAppointments = appointments;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [firstDayOfMonth, daysInMonth]);
  const getAppointmentsForDay = (day: number): AppointmentEx[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return myAppointments.filter(a => {
      const aptDate = a.date?.split('T')[0] || a.date;
      return aptDate === dateStr;
    });
  };
  const selectedDateAppointments = selectedDate ? myAppointments.filter(a => {
    const aptDate = a.date?.split('T')[0] || a.date;
    return aptDate === selectedDate;
  }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')) : [];
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };
  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Kalendari
          </h1>
          <p className="text-sm lg:text-base text-gray-500 mt-1">
            Shikoni dhe menaxhoni orarin tuaj.
          </p>
        </div>
        <Button variant="outline" onClick={goToToday} size="sm">
          Sot
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2" padding="none">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 lg:p-4 border-b border-gray-200">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1 lg:gap-2">
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeftIcon className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <ChevronRightIcon className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-2 lg:p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-1 lg:mb-2">
              {DAYS.map(day => <div key={day} className="text-center text-xs lg:text-sm font-medium text-gray-500 py-1 lg:py-2">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.substring(0, 1)}</span>
                </div>)}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0.5 lg:gap-1">
              {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-16 lg:h-24" />;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayAppointments = getAppointmentsForDay(day);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              return <button key={day} onClick={() => setSelectedDate(dateStr)} className={`
                      h-16 lg:h-24 p-1 lg:p-2 rounded-lg text-left transition-colors
                      ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : 'hover:bg-gray-50'}
                      ${isToday ? 'bg-blue-50' : ''}
                    `}>
                    <span className={`
                      inline-flex items-center justify-center w-5 h-5 lg:w-7 lg:h-7 rounded-full text-xs lg:text-sm font-medium
                      ${isToday ? 'bg-blue-600 text-white' : 'text-gray-900'}
                    `}>
                      {day}
                    </span>
                    <div className="mt-0.5 lg:mt-1 space-y-0.5 lg:space-y-1">
                      {dayAppointments.slice(0, 2).map(apt => <div key={apt.id} className={`
                            text-[10px] lg:text-xs px-1 lg:px-1.5 py-0.5 rounded truncate
                            ${apt.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                            ${apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : ''}
                            ${apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                          `}>
                          {apt.startTime}
                        </div>)}
                      {dayAppointments.length > 2 && <div className="text-[10px] lg:text-xs text-gray-500 px-1 lg:px-1.5">
                          +{dayAppointments.length - 2}
                        </div>}
                    </div>
                  </button>;
            })}
            </div>
          </div>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">
              {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('sq-AL', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            }) : 'Zgjidhni një ditë'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? selectedDateAppointments.length > 0 ? <div className="space-y-3 lg:space-y-4">
                  {selectedDateAppointments.map(appointment => {
              const candidateId = appointment.candidateId || appointment.candidate?._id || appointment.candidate?.id || '';
              const candidate = candidateId ? getCandidateById(candidateId) : appointment.candidate;
              const carId = appointment.carId || appointment.car?._id || appointment.car?.id || '';
              const car = carId ? getCarById(carId) : appointment.car;
              return <div key={appointment.id} className={`
                          p-3 lg:p-4 rounded-lg border-l-4
                          ${appointment.status === 'completed' ? 'bg-green-50 border-green-500' : ''}
                          ${appointment.status === 'scheduled' ? 'bg-blue-50 border-blue-500' : ''}
                          ${appointment.status === 'cancelled' ? 'bg-red-50 border-red-500' : ''}
                        `}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm lg:text-base font-semibold text-gray-900">
                            {appointment.startTime} - {appointment.endTime}
                          </span>
                          <Badge variant={appointment.status === 'completed' ? 'success' : appointment.status === 'scheduled' ? 'info' : 'danger'} size="sm">
                            {appointment.status === 'completed' ? 'Përfunduar' : appointment.status === 'scheduled' ? 'E planifikuar' : 'Anuluar'}
                          </Badge>
                        </div>
                        <p className="text-sm lg:text-base font-medium text-gray-900">
                          {candidate?.firstName} {candidate?.lastName}
                        </p>
                        <p className="text-xs lg:text-sm text-gray-500">
                          {car?.model} • {car?.licensePlate}
                        </p>
                        {appointment.notes && <p className="text-xs lg:text-sm text-gray-600 mt-2 italic">
                            {appointment.notes}
                          </p>}
                      </div>;
            })}
                </div> : <div className="text-center py-8">
                  <CalendarIcon className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Nuk ka takime këtë ditë
                  </p>
                </div> : <div className="text-center py-8">
                <CalendarIcon className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Klikoni mbi një ditë për të parë takimet
                </p>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}