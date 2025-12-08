import React, { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { getAppointmentsByInstructor, getCandidateById, getCarById } from '../../utils/mockData';
import type { Appointment } from '../../types';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function CalendarPage() {
  const {
    user
  } = useAuth();
  const instructorId = user?.id || '2';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const myAppointments = getAppointmentsByInstructor(instructorId);
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
  const getAppointmentsForDay = (day: number): Appointment[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return myAppointments.filter(a => a.date === dateStr);
  };
  const selectedDateAppointments = selectedDate ? myAppointments.filter(a => a.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime)) : [];
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
  return <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Calendar
          </h1>
          <p className="text-sm lg:text-base text-gray-500 mt-1">
            View and manage your schedule.
          </p>
        </div>
        <Button variant="outline" onClick={goToToday} size="sm">
          Today
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
              {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            }) : 'Select a Day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? selectedDateAppointments.length > 0 ? <div className="space-y-3 lg:space-y-4">
                  {selectedDateAppointments.map(appointment => {
              const candidate = getCandidateById(appointment.candidateId);
              const car = getCarById(appointment.carId);
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
                            {appointment.status}
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
                    No appointments on this day
                  </p>
                </div> : <div className="text-center py-8">
                <CalendarIcon className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Click on a day to see appointments
                </p>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}