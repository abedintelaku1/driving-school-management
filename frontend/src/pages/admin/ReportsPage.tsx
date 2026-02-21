import { useState, useMemo, useEffect } from "react";
import {
  DownloadIcon,
  UsersIcon,
  CarIcon,
  CreditCardIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Tabs, TabList, Tab, TabPanel } from "../../components/ui/Tabs";
import { DataTable } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import { useLanguage } from "../../hooks/useLanguage";
import { api } from "../../utils/api";
import { toast } from "../../hooks/useToast";
import { ReportExportModal } from "../../components/ui/ReportExportModal";
import jsPDF from "jspdf";

// Helper function to format numbers: max 2 decimals, but if whole number, no .00
const formatNumber = (num: number): string => {
  if (Number.isInteger(num)) {
    return num.toString();
  }
  return num.toFixed(2).replace(/\.?0+$/, "");
};

// Helper function to format currency: max 2 decimals, but if whole number, no .00
const formatCurrency = (num: number): string => {
  const formatted = formatNumber(num);
  return `€${formatted}`;
};

type Candidate = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  uniqueClientNumber?: string;
  status?: string;
  instructorId?: string | { _id?: string; id?: string };
};

type Instructor = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  instructorType?: 'insider' | 'outsider';
  ratePerHour?: number;
  totalCredits?: number;
  user?: {
    firstName?: string;
    lastName?: string;
  };
};

type Car = {
  _id?: string;
  id?: string;
  model: string;
  licensePlate: string;
  status?: string;
  totalHours?: number;
  nextInspection?: string;
};

type Payment = {
  _id?: string;
  id?: string;
  candidateId?: string | { _id?: string; id?: string };
  amount: number;
  method: string;
  date: string;
};

type Appointment = {
  _id?: string;
  id?: string;
  candidateId?: string | { _id?: string; id?: string };
  instructorId?:
    | string
    | {
        _id?: string;
        id?: string;
        user?: { firstName?: string; lastName?: string };
      };
  carId?: string | { _id?: string; id?: string };
  status?: string;
  date: string;
  hours?: number;
};

export function ReportsPage() {
  const { t, language } = useLanguage();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCandidateExportModal, setShowCandidateExportModal] = useState(false);
  const [showInstructorExportModal, setShowInstructorExportModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candRes, instRes, carRes, payRes, aptRes] = await Promise.all([
          api.listCandidates(),
          api.listInstructors(),
          api.listCars(),
          api.listPayments(),
          api.listAppointments(),
        ]);

        if (candRes.ok && candRes.data) setCandidates(candRes.data);
        if (instRes.ok && instRes.data) setInstructors(instRes.data);
        if (carRes.ok && carRes.data) setCars(carRes.data);
        if (payRes.ok && payRes.data) setPayments(payRes.data);
        if (aptRes.ok && aptRes.data) setAppointments(aptRes.data);
      } catch (err) {
        console.error("Failed to load reports data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = !!(dateFrom || dateTo);

  // Normalize IDs and dates for filtering
  const normalizedPayments = useMemo(() => {
    return payments
      .filter((p) => p != null)
      .map((p) => ({
        ...p,
        id: p._id || p.id || "",
        candidateId:
          p.candidateId &&
          typeof p.candidateId === "object" &&
          p.candidateId !== null
            ? p.candidateId._id || p.candidateId.id || ""
            : p.candidateId || "",
        date: p.date ? p.date.split("T")[0] || p.date : "",
      }));
  }, [payments]);

  const normalizedAppointments = useMemo(() => {
    return appointments
      .filter((a) => a != null)
      .map((a) => ({
        ...a,
        id: a._id || a.id || "",
        candidateId:
          a.candidateId &&
          typeof a.candidateId === "object" &&
          a.candidateId !== null
            ? a.candidateId._id || a.candidateId.id || ""
            : a.candidateId || "",
        instructorId:
          a.instructorId &&
          typeof a.instructorId === "object" &&
          a.instructorId !== null
            ? a.instructorId._id || a.instructorId.id || ""
            : a.instructorId || "",
        carId:
          a.carId && typeof a.carId === "object" && a.carId !== null
            ? a.carId._id || a.carId.id || ""
            : a.carId || "",
        date: a.date ? a.date.split("T")[0] || a.date : "",
        hours: a.hours || 0,
      }));
  }, [appointments]);

  // Filter data based on date range
  const filteredPayments = useMemo(() => {
    if (!dateFrom && !dateTo) return normalizedPayments;
    return normalizedPayments.filter((p) => {
      const paymentDate = p.date;
      if (dateFrom && paymentDate < dateFrom) return false;
      if (dateTo && paymentDate > dateTo) return false;
      return true;
    });
  }, [normalizedPayments, dateFrom, dateTo]);

  const filteredAppointments = useMemo(() => {
    if (!dateFrom && !dateTo) return normalizedAppointments;
    return normalizedAppointments.filter((a) => {
      const appointmentDate = a.date;
      if (dateFrom && appointmentDate < dateFrom) return false;
      if (dateTo && appointmentDate > dateTo) return false;
      return true;
    });
  }, [normalizedAppointments, dateFrom, dateTo]);

  // Calculate stats
  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter(
    (c) => !c.status || c.status === "active"
  ).length;
  const totalRevenue = filteredPayments.reduce((sum, p) => {
    const amount =
      typeof p.amount === "number"
        ? p.amount
        : parseFloat(p.amount as any) || 0;
    return sum + amount;
  }, 0);
  const totalHours = filteredAppointments
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + (a.hours || 0), 0);

  // Export all reports to CSV
  const handleExportAll = () => {
    try {
      const dateRange =
        dateFrom && dateTo
          ? `${dateFrom}_to_${dateTo}`
          : dateFrom
          ? `from_${dateFrom}`
          : dateTo
          ? `to_${dateTo}`
          : "all";
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${t('reports.csvFilenameAllReports')}_${dateRange}_${timestamp}.csv`;

      const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
      const locale = localeMap[language] || 'sq-AL';
      
      let csvContent = `${t('reports.fullExportTitle')}\n`;
      csvContent += `${t('reports.generated')}: ${new Date().toLocaleString(locale)}\n`;
      if (dateFrom || dateTo) {
        csvContent += `${t('reports.period')}: ${dateFrom || t('reports.all')} ${t('common.to')} ${
          dateTo || t('reports.all')
        }\n`;
      }
      csvContent += "\n";

      // 1. Summary Stats
      csvContent += `=== ${t('reports.summaryStatistics')} ===\n`;
      csvContent += `${t('reports.totalCandidatesLabel')},${totalCandidates}\n`;
      csvContent += `${t('reports.activeCandidatesLabel')},${activeCandidates}\n`;
      csvContent += `${t('reports.totalRevenueLabel')},${formatCurrency(totalRevenue)}\n`;
      csvContent += `${t('reports.totalHoursTaughtLabel')},${formatNumber(totalHours)}\n`;
      csvContent += `${t('reports.activeCarsLabel')},${
        cars.filter((c) => !c.status || c.status === "active").length
      }\n`;
      csvContent += `${t('reports.totalCarsLabel')},${cars.length}\n`;
      csvContent += "\n";

      // 2. Instructor Performance
      csvContent += `=== ${t('reports.instructorPerformanceTitle')} ===\n`;
      const instructorStats = instructors
        .filter((instructor) => instructor != null)
        .map((instructor) => {
          const instructorId = instructor._id || instructor.id || "";
          const appointments = filteredAppointments.filter((a) => {
            const aptInstructorId =
              typeof a.instructorId === "string" ? a.instructorId : "";
            return aptInstructorId === instructorId;
          });
          const completedAppointments = appointments.filter(
            (a) => a.status === "completed"
          );
          const totalHours = completedAppointments.reduce(
            (sum, a) => sum + (a.hours || 0),
            0
          );
          const instructorCandidates = candidates.filter((c) => {
            if (!c.instructorId) return false;
            const candidateInstructorId =
              typeof c.instructorId === "string"
                ? c.instructorId
                : c.instructorId &&
                  typeof c.instructorId === "object" &&
                  c.instructorId !== null
                ? c.instructorId._id || c.instructorId.id || ""
                : "";
            return candidateInstructorId === instructorId;
          });
          const firstName =
            instructor.firstName || instructor.user?.firstName || "";
          const lastName =
            instructor.lastName || instructor.user?.lastName || "";
          const instructorType = instructor.instructorType || 'insider';
          const ratePerHour = instructor.ratePerHour || 0;
          const totalCredits = instructor.totalCredits || 0;
          return {
            name: `${firstName} ${lastName}`.trim() || t('common.unknown'),
            totalHours,
            completedLessons: completedAppointments.length,
            activeCandidates: instructorCandidates.filter(
              (c) => !c.status || c.status === "active"
            ).length,
            totalCandidates: instructorCandidates.length,
            status: instructor.status || "active",
            instructorType,
            ratePerHour,
            totalCredits,
          };
        });

      csvContent +=
        `${t('reports.instructorColumn')},${t('reports.typeColumn')},${t('reports.hoursTaughtColumn')},${t('reports.payPerHourColumn')},${t('reports.totalPaymentColumn')},${t('reports.lessonsColumn')},${t('reports.activeStudentsColumn')},${t('reports.totalStudentsColumn')},${t('reports.statusColumn')}\n`;
      instructorStats.forEach((stat) => {
        const type = stat.instructorType === 'outsider' ? t('reports.byHour') : t('reports.fixedSalary');
        const ratePerHour = stat.instructorType === 'outsider' ? formatCurrency(stat.ratePerHour || 0) : '-';
        const totalCredits = stat.instructorType === 'outsider' ? formatCurrency(stat.totalCredits || 0) : '-';
        csvContent +=
          `"${stat.name}","${type}",${formatNumber(stat.totalHours)},"${ratePerHour}","${totalCredits}",${stat.completedLessons},${stat.activeCandidates},${stat.totalCandidates},${stat.status}\n`;
      });
      csvContent += "\n";

      // 3. Candidate Progress
      csvContent += `=== ${t('reports.candidateProgressTitle')} ===\n`;
      const candidateStats = candidates
        .filter(
          (candidate) =>
            candidate != null && candidate.firstName && candidate.lastName
        )
        .map((candidate) => {
          const candidateId = candidate._id || candidate.id || "";
          const appointments = filteredAppointments.filter((a) => {
            const aptCandidateId =
              typeof a.candidateId === "string" ? a.candidateId : "";
            return aptCandidateId === candidateId;
          });
          const completedHours = appointments
            .filter((a) => a.status === "completed")
            .reduce((sum, a) => sum + (a.hours || 0), 0);
          const payments = filteredPayments.filter((p) => {
            const payCandidateId =
              typeof p.candidateId === "string" ? p.candidateId : "";
            return payCandidateId === candidateId;
          });
          const totalPaid = payments.reduce((sum, p) => {
            const amount =
              typeof p.amount === "number"
                ? p.amount
                : parseFloat(p.amount as any) || 0;
            return sum + amount;
          }, 0);
          return {
            name: `${candidate.firstName} ${candidate.lastName}`,
            clientNumber: candidate.uniqueClientNumber || "",
            completedHours,
            scheduledLessons: appointments.filter(
              (a) => a.status === "scheduled"
            ).length,
            totalPaid,
            status: candidate.status || "active",
          };
        });

      csvContent +=
        `${t('reports.candidateColumn')},${t('reports.clientNumberColumn')},${t('reports.completedHoursColumn')},${t('reports.scheduledLessonsColumn')},${t('reports.totalPaidColumn')},${t('reports.statusColumn')}\n`;
      candidateStats.forEach((stat) => {
        csvContent += `"${stat.name}","${stat.clientNumber}",${
          formatNumber(stat.completedHours)
        },${stat.scheduledLessons},${formatCurrency(stat.totalPaid)},${
          stat.status
        }\n`;
      });
      csvContent += "\n";

      // 4. Car Usage
      csvContent += `=== ${t('reports.carUsageTitle')} ===\n`;
      const carStats = cars
        .filter((car) => car != null && car.model && car.licensePlate)
        .map((car) => {
          const carId = car._id || car.id || "";
          const appointments = filteredAppointments.filter((a) => {
            const aptCarId = typeof a.carId === "string" ? a.carId : "";
            return aptCarId === carId;
          });
          const usageHours = appointments
            .filter((a) => a.status === "completed")
            .reduce((sum, a) => sum + (a.hours || 0), 0);
          const nextInspectionDate = car.nextInspection
            ? typeof car.nextInspection === "string"
              ? car.nextInspection.split("T")[0]
              : String(car.nextInspection)
            : "";
          return {
            model: car.model,
            licensePlate: car.licensePlate,
            totalHours: car.totalHours || 0,
            recentUsage: usageHours,
            nextInspection: nextInspectionDate,
            status: car.status || "active",
          };
        });

      csvContent +=
        `${t('cars.modelColumn')},${t('cars.licensePlateColumn')},${t('reports.totalHoursColumn')},${t('reports.recentUsageColumn')},${t('cars.nextInspectionColumn')},${t('reports.statusColumn')}\n`;
      carStats.forEach((stat) => {
        csvContent += `"${stat.model}","${stat.licensePlate}",${formatNumber(stat.totalHours)},${formatNumber(stat.recentUsage)},"${stat.nextInspection}",${stat.status}\n`;
      });
      csvContent += "\n";

      // 5. Payment Summary
      csvContent += `=== ${t('reports.paymentSummaryByMonth')} ===\n`;
      const paymentsByMonth: Record<
        string,
        {
          total: number;
          count: number;
          bank: number;
          cash: number;
        }
      > = {};
      filteredPayments
        .filter((payment) => payment != null && payment.date)
        .forEach((payment) => {
          if (!payment.date) return;
          const month = payment.date.substring(0, 7); // YYYY-MM
          if (!paymentsByMonth[month]) {
            paymentsByMonth[month] = {
              total: 0,
              count: 0,
              bank: 0,
              cash: 0,
            };
          }
          const amount =
            typeof payment.amount === "number"
              ? payment.amount
              : parseFloat(payment.amount as any) || 0;
          paymentsByMonth[month].total += amount;
          paymentsByMonth[month].count += 1;
          if (payment.method === "bank" || payment.method === "Bank") {
            paymentsByMonth[month].bank += amount;
          } else if (payment.method === "cash" || payment.method === "Cash") {
            paymentsByMonth[month].cash += amount;
          }
        });

      const monthlyData = Object.entries(paymentsByMonth)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => b.month.localeCompare(a.month));

      csvContent += `${t('reports.monthColumn')},${t('reports.totalColumn')},${t('reports.transactionsColumn')},${t('reports.bankColumn')},${t('reports.cashColumn')}\n`;
      monthlyData.forEach((data) => {
        const monthName = new Date(data.month + "-01").toLocaleDateString(
          locale,
          {
            year: "numeric",
            month: "long",
          }
        );
        csvContent += `"${monthName}",${formatCurrency(data.total)},${
          data.count
        },${formatCurrency(data.bank)},${formatCurrency(data.cash)}\n`;
      });

      // Download CSV with UTF-8 BOM for Excel compatibility
      // Add BOM (Byte Order Mark) so Excel recognizes UTF-8 encoding
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast("success", t('reports.reportsExported'));
    } catch (error) {
      console.error("Error exporting reports:", error);
      toast("error", t('reports.exportFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">{t('reports.loadingReports')}</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('reports.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={<DownloadIcon className="w-4 h-4" />}
            onClick={handleExportAll}
          >
            {t('reports.exportCSV')}
          </Button>
          <Button
            variant="primary"
            icon={<DownloadIcon className="w-4 h-4" />}
            onClick={() => setShowCandidateExportModal(true)}
          >
            {t('reports.exportCandidate')}
          </Button>
          <Button
            variant="primary"
            icon={<DownloadIcon className="w-4 h-4" />}
            onClick={() => setShowInstructorExportModal(true)}
          >
            {t('reports.exportInstructor')}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('reports.totalCandidates')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCandidates}
              </p>
              <p className="text-xs text-green-600">
                {activeCandidates} {t('reports.active')}
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
              <p className="text-sm text-gray-500">{t('reports.totalRevenue')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-xs text-gray-500">
                {filteredPayments.length} {t('reports.transactions')}
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
              <p className="text-sm text-gray-500">{t('reports.hoursTaught')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalHours)}h</p>
              <p className="text-xs text-gray-500">
                {
                  filteredAppointments.filter((a) => a.status === "completed")
                    .length
                }{" "}
                {t('reports.lessons')}
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
              <p className="text-sm text-gray-500">{t('reports.activeCars')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {cars.filter((c) => !c.status || c.status === "active").length}
              </p>
              <p className="text-xs text-gray-500">{t('reports.fromTotal').replace('{total}', cars.length.toString())}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Date Filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 flex flex-wrap gap-3">
            <div className="w-full sm:w-40">
              <Input
                label={t('reports.fromDate')}
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Input
                label={t('reports.toDate')}
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {t('common.clear')}
            </Button>
          )}
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs defaultTab="instructors">
        <TabList>
          <Tab value="instructors">{t('reports.instructorPerformance')}</Tab>
          <Tab value="candidates">{t('reports.candidateProgress')}</Tab>
          <Tab value="cars">{t('reports.carUsage')}</Tab>
          <Tab value="payments">{t('reports.paymentSummary')}</Tab>
        </TabList>

        <TabPanel value="instructors">
          <InstructorPerformanceReport
            filteredAppointments={filteredAppointments}
            instructors={instructors}
            candidates={candidates}
          />
        </TabPanel>

        <TabPanel value="candidates">
          <CandidateProgressReport
            filteredAppointments={filteredAppointments}
            filteredPayments={filteredPayments}
            candidates={candidates}
          />
        </TabPanel>

        <TabPanel value="cars">
          <CarUsageReport
            filteredAppointments={filteredAppointments}
            cars={cars}
          />
        </TabPanel>

        <TabPanel value="payments">
          <PaymentSummaryReport filteredPayments={filteredPayments} />
        </TabPanel>
      </Tabs>

      {/* Export Modals */}
      <ReportExportModal
        isOpen={showCandidateExportModal}
        onClose={() => setShowCandidateExportModal(false)}
        type="candidate"
        candidates={candidates.map(c => ({
          id: c._id || c.id || '',
          firstName: c.firstName,
          lastName: c.lastName,
          uniqueClientNumber: c.uniqueClientNumber
        }))}
      />

      <ReportExportModal
        isOpen={showInstructorExportModal}
        onClose={() => setShowInstructorExportModal(false)}
        type="instructor"
        instructors={instructors.map(i => ({
          id: i._id || i.id || '',
          firstName: i.firstName || i.user?.firstName,
          lastName: i.lastName || i.user?.lastName,
          user: i.user
        }))}
      />
    </div>
  );
}
function InstructorPerformanceReport({
  filteredAppointments,
  instructors,
  candidates,
}: {
  filteredAppointments: Appointment[];
  instructors: Instructor[];
  candidates: Candidate[];
}) {
  const { t } = useLanguage();
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  
  const instructorStats = instructors
    .filter((instructor) => instructor != null)
    .map((instructor) => {
      const instructorId = instructor._id || instructor.id || "";
      const appointments = filteredAppointments.filter((a) => {
        const aptInstructorId =
          typeof a.instructorId === "string" ? a.instructorId : "";
        return aptInstructorId === instructorId;
      });
      const completedAppointments = appointments.filter(
        (a) => a.status === "completed"
      );
      const totalHours = completedAppointments.reduce(
        (sum, a) => sum + (a.hours || 0),
        0
      );
      const instructorCandidates = candidates.filter((c) => {
        if (!c.instructorId) return false;
        const candidateInstructorId =
          typeof c.instructorId === "string"
            ? c.instructorId
            : c.instructorId &&
              typeof c.instructorId === "object" &&
              c.instructorId !== null
            ? c.instructorId._id || c.instructorId.id || ""
            : "";
        return candidateInstructorId === instructorId;
      });
      const firstName =
        instructor.firstName || instructor.user?.firstName || "";
      const lastName = instructor.lastName || instructor.user?.lastName || "";
      const instructorType = instructor.instructorType || 'insider';
      const ratePerHour = instructor.ratePerHour || 0;
      const totalCredits = instructor.totalCredits || 0;
      return {
        id: instructorId,
        name: `${firstName} ${lastName}`.trim() || t('common.unknown'),
        totalHours,
        completedLessons: completedAppointments.length,
        activeCandidates: instructorCandidates.filter(
          (c) => !c.status || c.status === "active"
        ).length,
        totalCandidates: instructorCandidates.length,
        status: instructor.status || "active",
        instructorType,
        ratePerHour,
        totalCredits,
      };
    });

  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    
    if (exportFormat === 'csv') {
      const BOM = "\uFEFF";
      let csvContent = BOM + `=== ${t('reports.instructorPerformanceTitle')} ===\n`;
      csvContent += `${t('reports.instructorColumn')},${t('reports.typeColumn')},${t('reports.hoursTaughtColumn')},${t('reports.payPerHourColumn')},${t('reports.totalPaymentColumn')},${t('reports.lessonsColumn')},${t('reports.activeStudentsColumn')},${t('reports.totalStudentsColumn')},${t('reports.statusColumn')}\n`;
      instructorStats.forEach((stat) => {
        const type = stat.instructorType === 'outsider' ? t('reports.byHour') : t('reports.fixedSalary');
        const ratePerHour = stat.instructorType === 'outsider' ? formatCurrency(stat.ratePerHour || 0) : '-';
        const totalCredits = stat.instructorType === 'outsider' ? formatCurrency(stat.totalCredits || 0) : '-';
        csvContent += `"${stat.name}","${type}",${formatNumber(stat.totalHours)},"${ratePerHour}","${totalCredits}",${stat.completedLessons},${stat.activeCandidates},${stat.totalCandidates},${stat.status}\n`;
      });

      const filename = `${t('reports.csvFilenameInstructorPerformance')}_${timestamp}.csv`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // PDF Export
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(t('reports.instructorPerformanceTitle'), 14, 20);
      doc.setFontSize(10);
      doc.text(`${t('reports.exportDate')}: ${new Date().toLocaleDateString(locale)}`, 14, 30);
      
      let yPos = 40;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(t('reports.instructorColumn'), 14, yPos);
      doc.text(t('reports.typeColumn'), 50, yPos);
      doc.text(t('reports.hoursTaughtColumn'), 70, yPos);
      doc.text(t('reports.payPerHourColumn'), 85, yPos);
      doc.text(t('reports.totalPaymentColumn'), 110, yPos);
      doc.text(t('reports.lessonsColumn'), 135, yPos);
      doc.text(t('reports.activeStudentsColumn'), 155, yPos);
      doc.text(t('reports.totalStudentsColumn'), 180, yPos);
      
      yPos += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      instructorStats.forEach((stat) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
          // Redraw headers on new page
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(t('reports.instructorColumn'), 14, yPos);
          doc.text(t('reports.typeColumn'), 50, yPos);
          doc.text(t('reports.hoursTaughtColumn'), 70, yPos);
          doc.text(t('reports.payPerHourColumn'), 85, yPos);
          doc.text(t('reports.totalPaymentColumn'), 110, yPos);
          doc.text(t('reports.lessonsColumn'), 135, yPos);
          doc.text(t('reports.activeStudentsColumn'), 155, yPos);
          doc.text(t('reports.totalStudentsColumn'), 180, yPos);
          yPos += 8;
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
        }
        doc.text(stat.name.substring(0, 15), 14, yPos);
        doc.text(stat.instructorType === 'outsider' ? t('reports.byHour') : t('reports.fixedSalary'), 50, yPos);
        doc.text(formatNumber(stat.totalHours), 70, yPos);
        if (stat.instructorType === 'outsider') {
          doc.text(formatCurrency(stat.ratePerHour || 0), 85, yPos);
          doc.text(formatCurrency(stat.totalCredits || 0), 110, yPos);
        } else {
          doc.text('-', 85, yPos);
          doc.text('-', 110, yPos);
        }
        doc.text(stat.completedLessons.toString(), 135, yPos);
        doc.text(stat.activeCandidates.toString(), 155, yPos);
        doc.text(stat.totalCandidates.toString(), 180, yPos);
        yPos += 7;
      });
      
      doc.save(`${t('reports.csvFilenameInstructorPerformance')}_${timestamp}.pdf`);
    }
    
    toast("success", t('reports.reportExported'));
  };
  const columns = [
    {
      key: "name",
      label: t('reports.instructorColumn'),
      sortable: true,
    },
    {
      key: "instructorType",
      label: t('reports.typeColumn'),
      sortable: true,
      render: (value: unknown) => {
        const type = value as 'insider' | 'outsider';
        return (
          <Badge variant={type === 'outsider' ? 'info' : 'outline'} size="sm">
            {type === 'outsider' ? t('reports.byHour') : t('reports.fixedSalary')}
          </Badge>
        );
      },
    },
    {
      key: "totalHours",
      label: t('reports.hoursTaughtColumn'),
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{formatNumber(value as number)}h</span>
      ),
    },
    {
      key: "ratePerHour",
      label: t('reports.payPerHourColumn'),
      sortable: true,
      render: (_: unknown, stat: any) => {
        if (stat.instructorType !== 'outsider') {
          return <span className="text-gray-400">-</span>;
        }
        return <span className="font-medium">{formatCurrency(stat.ratePerHour || 0)}</span>;
      },
    },
    {
      key: "totalCredits",
      label: t('reports.totalPaymentColumn'),
      sortable: true,
      render: (_: unknown, stat: any) => {
        if (stat.instructorType !== 'outsider') {
          return <span className="text-gray-400">-</span>;
        }
        return <span className="font-semibold text-green-600">{formatCurrency(stat.totalCredits || 0)}</span>;
      },
    },
    {
      key: "completedLessons",
      label: t('reports.lessonsColumn'),
      sortable: true,
    },
    {
      key: "activeCandidates",
      label: t('reports.activeStudentsColumn'),
      sortable: true,
    },
    {
      key: "totalCandidates",
      label: t('reports.totalStudentsColumn'),
      sortable: true,
    },
    {
      key: "status",
      label: t('reports.statusColumn'),
      render: (value: unknown) => (
        <Badge variant={value === "active" ? "success" : "danger"} dot>
          {value === "active" ? t('common.active') : (value as string)}
        </Badge>
      ),
    },
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-3 items-center">
        <Select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
          options={[
            { value: 'csv', label: t('reports.csv') },
            { value: 'pdf', label: t('reports.pdf') },
          ]}
          placeholder={t('common.selectOption')}
          className="w-32"
        />
        <Button
          variant="outline"
          icon={<DownloadIcon className="w-4 h-4" />}
          onClick={handleExport}
        >
          {exportFormat === 'csv' ? t('reports.exportCSV') : t('reports.exportPDF')}
        </Button>
      </div>
      <Card padding="none">
        <DataTable
          data={instructorStats}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchable={false}
          pagination={false}
        />
      </Card>
    </div>
  );
}
function CandidateProgressReport({
  filteredAppointments,
  filteredPayments,
  candidates,
}: {
  filteredAppointments: Appointment[];
  filteredPayments: Payment[];
  candidates: Candidate[];
}) {
  const { t } = useLanguage();
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  
  const candidateStats = candidates
    .filter(
      (candidate) =>
        candidate != null && candidate.firstName && candidate.lastName
    )
    .map((candidate) => {
      const candidateId = candidate._id || candidate.id || "";
      const appointments = filteredAppointments.filter((a) => {
        const aptCandidateId =
          typeof a.candidateId === "string" ? a.candidateId : "";
        return aptCandidateId === candidateId;
      });
      const completedHours = appointments
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + (a.hours || 0), 0);
      const payments = filteredPayments.filter((p) => {
        const payCandidateId =
          typeof p.candidateId === "string" ? p.candidateId : "";
        return payCandidateId === candidateId;
      });
      const totalPaid = payments.reduce((sum, p) => {
        const amount =
          typeof p.amount === "number"
            ? p.amount
            : parseFloat(p.amount as any) || 0;
        return sum + amount;
      }, 0);
      return {
        id: candidateId,
        name: `${candidate.firstName} ${candidate.lastName}`,
        clientNumber: candidate.uniqueClientNumber || "",
        completedHours,
        scheduledLessons: appointments.filter((a) => a.status === "scheduled")
          .length,
        totalPaid,
        status: candidate.status || "active",
      };
    });
  const columns = [
    {
      key: "name",
      label: t('reports.candidateColumn'),
      sortable: true,
      render: (_: unknown, item: (typeof candidateStats)[0]) => (
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-gray-500">{item.clientNumber}</p>
        </div>
      ),
    },
    {
      key: "completedHours",
      label: t('reports.completedHoursColumn'),
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{formatNumber(value as number)}h</span>
      ),
    },
    {
      key: "scheduledLessons",
      label: t('reports.scheduledLessonsColumn'),
      sortable: true,
    },
    {
      key: "totalPaid",
      label: t('reports.totalPaidColumn'),
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: "status",
      label: t('reports.statusColumn'),
      render: (value: unknown) => (
        <Badge variant={value === "active" ? "success" : "danger"} dot>
          {value === "active" ? t('common.active') : (value as string)}
        </Badge>
      ),
    },
  ];
  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    
    if (exportFormat === 'csv') {
      const BOM = "\uFEFF";
      let csvContent = BOM + `=== ${t('reports.candidateProgressTitle')} ===\n`;
      csvContent += `${t('reports.candidateColumn')},${t('reports.clientNumberColumn')},${t('reports.completedHoursColumn')},${t('reports.scheduledLessonsColumn')},${t('reports.totalPaidColumn')},${t('reports.statusColumn')}\n`;
      candidateStats.forEach((stat) => {
        csvContent += `"${stat.name}","${stat.clientNumber}",${formatNumber(stat.completedHours)},${stat.scheduledLessons},${formatCurrency(stat.totalPaid)},${stat.status}\n`;
      });

      const filename = `${t('reports.csvFilenameCandidateProgress')}_${timestamp}.csv`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // PDF Export
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(t('reports.candidateProgressTitle'), 14, 20);
      doc.setFontSize(10);
      const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
      const locale = localeMap[language] || 'sq-AL';
      doc.text(`${t('reports.exportDate')}: ${new Date().toLocaleDateString(locale)}`, 14, 30);
      
      let yPos = 40;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(t('reports.candidateColumn'), 14, yPos);
      doc.text(t('candidates.clientNumberColumn'), 60, yPos);
      doc.text(t('reports.hoursColumn'), 95, yPos);
      doc.text(t('reports.lessonsColumn'), 110, yPos);
      doc.text(t('reports.totalColumn'), 130, yPos);
      doc.text(t('reports.statusColumn'), 170, yPos);
      
      yPos += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      candidateStats.forEach((stat) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(stat.name.substring(0, 20), 14, yPos);
        doc.text(stat.clientNumber || t('common.n/a'), 60, yPos);
        doc.text(formatNumber(stat.completedHours), 95, yPos);
        doc.text(stat.scheduledLessons.toString(), 110, yPos);
        doc.text(formatCurrency(stat.totalPaid), 130, yPos);
        doc.text(stat.status === 'active' ? t('common.active') : stat.status, 170, yPos);
        yPos += 7;
      });
      
      doc.save(`${t('reports.csvFilenameCandidateProgress')}_${timestamp}.pdf`);
    }
    
    toast("success", t('reports.reportExported'));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-3 items-center">
        <Select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
          options={[
            { value: 'csv', label: t('reports.csv') },
            { value: 'pdf', label: t('reports.pdf') },
          ]}
          placeholder={t('common.selectOption')}
          className="w-32"
        />
        <Button
          variant="outline"
          icon={<DownloadIcon className="w-4 h-4" />}
          onClick={handleExport}
        >
          {exportFormat === 'csv' ? t('reports.exportCSV') : t('reports.exportPDF')}
        </Button>
      </div>
      <Card padding="none">
        <DataTable
          data={candidateStats}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchable
          searchPlaceholder={t('reports.searchCandidates')}
          searchKeys={["name", "clientNumber"]}
        />
      </Card>
    </div>
  );
}
function CarUsageReport({
  filteredAppointments,
  cars,
}: {
  filteredAppointments: Appointment[];
  cars: Car[];
}) {
  const { t } = useLanguage();
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  
  const carStats = cars
    .filter((car) => car != null && car.model && car.licensePlate)
    .map((car) => {
      const carId = car._id || car.id || "";
      const appointments = filteredAppointments.filter((a) => {
        const aptCarId = typeof a.carId === "string" ? a.carId : "";
        return aptCarId === carId;
      });
      const usageHours = appointments
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + (a.hours || 0), 0);
      const nextInspectionDate = car.nextInspection
        ? typeof car.nextInspection === "string"
          ? car.nextInspection.split("T")[0]
          : String(car.nextInspection)
        : "";
      return {
        id: carId,
        model: car.model,
        licensePlate: car.licensePlate,
        totalHours: car.totalHours || 0,
        recentUsage: usageHours,
        nextInspection: nextInspectionDate,
        status: car.status || "active",
      };
    });
  const columns = [
    {
      key: "model",
      label: t('reports.vehicleColumn'),
      sortable: true,
      render: (_: unknown, item: (typeof carStats)[0]) => (
        <div>
          <p className="font-medium">{item.model}</p>
          <p className="text-sm text-gray-500 font-mono">{item.licensePlate}</p>
        </div>
      ),
    },
    {
      key: "totalHours",
      label: t('reports.totalHoursColumn'),
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{formatNumber(value as number)}h</span>
      ),
    },
    {
      key: "recentUsage",
      label: t('reports.recentUsageColumn'),
      sortable: true,
      render: (value: unknown) => <span>{formatNumber(value as number)}h</span>,
    },
    {
      key: "nextInspection",
      label: t('reports.nextInspectionColumn'),
      sortable: true,
    },
    {
      key: "status",
      label: t('reports.statusColumn'),
      render: (value: unknown) => (
        <Badge variant={value === "active" ? "success" : "danger"} dot>
          {value === "active" ? t('common.active') : (value as string)}
        </Badge>
      ),
    },
  ];
  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    
    if (exportFormat === 'csv') {
      const BOM = "\uFEFF";
      let csvContent = BOM + `=== ${t('reports.carUsageTitle')} ===\n`;
      csvContent += `${t('cars.modelColumn')},${t('cars.licensePlateColumn')},${t('reports.totalHoursColumn')},${t('reports.recentUsageColumn')},${t('reports.nextInspectionColumn')},${t('reports.statusColumn')}\n`;
      carStats.forEach((stat) => {
        csvContent += `"${stat.model}","${stat.licensePlate}",${formatNumber(stat.totalHours)},${formatNumber(stat.recentUsage)},"${stat.nextInspection}",${stat.status}\n`;
      });

      const filename = `${t('reports.csvFilenameCarUsage')}_${timestamp}.csv`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // PDF Export
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(t('reports.carUsageTitle'), 14, 20);
      doc.setFontSize(10);
      const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
      const locale = localeMap[language] || 'sq-AL';
      doc.text(`${t('reports.exportDate')}: ${new Date().toLocaleDateString(locale)}`, 14, 30);
      
      let yPos = 40;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(t('cars.modelColumn'), 14, yPos);
      doc.text(t('cars.licensePlateColumn'), 60, yPos);
      doc.text(t('reports.totalHoursColumn'), 95, yPos);
      doc.text(t('reports.recentUsageColumn'), 130, yPos);
      doc.text(t('cars.nextInspectionColumn'), 160, yPos);
      doc.text(t('reports.statusColumn'), 190, yPos);
      
      yPos += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      carStats.forEach((stat) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(stat.model.substring(0, 20), 14, yPos);
        doc.text(stat.licensePlate, 60, yPos);
        doc.text(formatNumber(stat.totalHours), 95, yPos);
        doc.text(formatNumber(stat.recentUsage), 130, yPos);
        doc.text(stat.nextInspection || t('common.n/a'), 160, yPos);
        doc.text(stat.status === 'active' ? t('common.active') : stat.status, 190, yPos);
        yPos += 7;
      });
      
      doc.save(`${t('reports.csvFilenameCarUsage')}_${timestamp}.pdf`);
    }
    
    toast("success", t('reports.reportExported'));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-3 items-center">
        <Select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
          options={[
            { value: 'csv', label: t('reports.csv') },
            { value: 'pdf', label: t('reports.pdf') },
          ]}
          placeholder={t('common.selectOption')}
          className="w-32"
        />
        <Button
          variant="outline"
          icon={<DownloadIcon className="w-4 h-4" />}
          onClick={handleExport}
        >
          {exportFormat === 'csv' ? t('reports.exportCSV') : t('reports.exportPDF')}
        </Button>
      </div>
      <Card padding="none">
        <DataTable
          data={carStats}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchable={false}
          pagination={false}
        />
      </Card>
    </div>
  );
}
function PaymentSummaryReport({
  filteredPayments,
}: {
  filteredPayments: Payment[];
}) {
  const { t, language } = useLanguage();
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  
  // Group payments by month
  const paymentsByMonth: Record<
    string,
    {
      total: number;
      count: number;
      bank: number;
      cash: number;
    }
  > = {};
  filteredPayments
    .filter((payment) => payment != null && payment.date)
    .forEach((payment) => {
      if (!payment.date) return;
      const month = payment.date.substring(0, 7); // YYYY-MM
      if (!paymentsByMonth[month]) {
        paymentsByMonth[month] = {
          total: 0,
          count: 0,
          bank: 0,
          cash: 0,
        };
      }
      const amount =
        typeof payment.amount === "number"
          ? payment.amount
          : parseFloat(payment.amount as any) || 0;
      paymentsByMonth[month].total += amount;
      paymentsByMonth[month].count += 1;
      if (payment.method === "bank" || payment.method === "Bank") {
        paymentsByMonth[month].bank += amount;
      } else if (payment.method === "cash" || payment.method === "Cash") {
        paymentsByMonth[month].cash += amount;
      }
    });
  const monthlyData = Object.entries(paymentsByMonth)
    .map(([month, data]) => ({
      id: month,
      month,
      ...data,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
  const columns = [
    {
      key: "month",
      label: t('reports.monthColumn'),
      sortable: true,
      render: (value: unknown) => {
        const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
        const locale = localeMap[language] || 'sq-AL';
        const date = new Date((value as string) + "-01");
        return date.toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
        });
      },
    },
    {
      key: "total",
      label: t('reports.totalColumn'),
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-green-600">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: "count",
      label: t('reports.transactionsColumn'),
      sortable: true,
    },
    {
      key: "bank",
      label: t('reports.bankColumn'),
      render: (value: unknown) => <span>{formatCurrency(value as number)}</span>,
    },
    {
      key: "cash",
      label: t('reports.cashColumn'),
      render: (value: unknown) => <span>{formatCurrency(value as number)}</span>,
    },
  ];
  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
    const locale = localeMap[language] || 'sq-AL';
    
    if (exportFormat === 'csv') {
      const BOM = "\uFEFF";
      let csvContent = BOM + `=== ${t('reports.paymentSummaryByMonth')} ===\n`;
      csvContent += `${t('reports.monthColumn')},${t('reports.totalColumn')},${t('reports.transactionsColumn')},${t('reports.bankColumn')},${t('reports.cashColumn')}\n`;
      monthlyData.forEach((data) => {
        const monthName = new Date(data.month + "-01").toLocaleDateString(
          locale,
          {
            year: "numeric",
            month: "long",
          }
        );
        csvContent += `"${monthName}",${formatCurrency(data.total)},${data.count},${formatCurrency(data.bank)},${formatCurrency(data.cash)}\n`;
      });

      const filename = `${t('reports.csvFilenamePaymentSummary')}_${timestamp}.csv`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // PDF Export
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(t('reports.paymentSummaryByMonth'), 14, 20);
      doc.setFontSize(10);
      doc.text(`${t('reports.exportDate')}: ${new Date().toLocaleDateString(locale)}`, 14, 30);
      
      let yPos = 40;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(t('reports.monthColumn'), 14, yPos);
      doc.text(t('reports.totalColumn'), 70, yPos);
      doc.text(t('reports.transactionsColumn'), 100, yPos);
      doc.text(t('reports.bankColumn'), 140, yPos);
      doc.text(t('reports.cashColumn'), 170, yPos);
      
      yPos += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      monthlyData.forEach((data) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const monthName = new Date(data.month + "-01").toLocaleDateString(
          locale,
          {
            year: "numeric",
            month: "long",
          }
        );
        doc.text(monthName, 14, yPos);
        doc.text(formatCurrency(data.total), 70, yPos);
        doc.text(data.count.toString(), 100, yPos);
        doc.text(formatCurrency(data.bank), 140, yPos);
        doc.text(formatCurrency(data.cash), 170, yPos);
        yPos += 7;
      });
      
      doc.save(`${t('reports.csvFilenamePaymentSummary')}_${timestamp}.pdf`);
    }
    
    toast("success", t('reports.reportExported'));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-3 items-center">
        <Select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
          options={[
            { value: 'csv', label: t('reports.csv') },
            { value: 'pdf', label: t('reports.pdf') },
          ]}
          placeholder={t('common.selectOption')}
          className="w-32"
        />
        <Button
          variant="outline"
          icon={<DownloadIcon className="w-4 h-4" />}
          onClick={handleExport}
        >
          {exportFormat === 'csv' ? t('reports.exportCSV') : t('reports.exportPDF')}
        </Button>
      </div>
      <Card padding="none">
        <DataTable
          data={monthlyData}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchable={false}
          pagination={false}
        />
      </Card>
    </div>
  );
}
