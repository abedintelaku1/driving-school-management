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
      const filename = `reports_all_${dateRange}_${timestamp}.csv`;

      let csvContent = "Menaxhimi i shkollës së makinave - Eksport i plotë raportesh\n";
      csvContent += `Gjeneruar: ${new Date().toLocaleString("sq-AL")}\n`;
      if (dateFrom || dateTo) {
        csvContent += `Periudha: ${dateFrom || "Të gjitha"} deri ${
          dateTo || "Të gjitha"
        }\n`;
      }
      csvContent += "\n";

      // 1. Summary Stats
      csvContent += "=== STATISTIKA PËRMBLEDHËSE ===\n";
      csvContent += `Kandidatët gjithsej,${totalCandidates}\n`;
      csvContent += `Kandidatë aktivë,${activeCandidates}\n`;
      csvContent += `Të ardhurat gjithsej,${formatCurrency(totalRevenue)}\n`;
      csvContent += `Orë të mësuara gjithsej,${formatNumber(totalHours)}\n`;
      csvContent += `Makinat aktive,${
        cars.filter((c) => !c.status || c.status === "active").length
      }\n`;
      csvContent += `Makinat gjithsej,${cars.length}\n`;
      csvContent += "\n";

      // 2. Instructor Performance
      csvContent += "=== INSTRUCTOR PERFORMANCE ===\n";
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
            name: `${firstName} ${lastName}`.trim() || "I panjohur",
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
        "Instruktori,Lloji,Orë të mësuara,Paga për orë,Pagesa totale,Mësime të përfunduara,Nxënës aktivë,Nxënës gjithsej,Statusi\n";
      instructorStats.forEach((stat) => {
        const type = stat.instructorType === 'outsider' ? 'Me orë' : 'Rrogë fikse';
        const ratePerHour = stat.instructorType === 'outsider' ? formatCurrency(stat.ratePerHour || 0) : '-';
        const totalCredits = stat.instructorType === 'outsider' ? formatCurrency(stat.totalCredits || 0) : '-';
        csvContent +=
          `"${stat.name}","${type}",${formatNumber(stat.totalHours)},"${ratePerHour}","${totalCredits}",${stat.completedLessons},${stat.activeCandidates},${stat.totalCandidates},${stat.status}\n`;
      });
      csvContent += "\n";

      // 3. Candidate Progress
      csvContent += "=== ECURIA E KANDIDATËVE ===\n";
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
        "Kandidati,Numri i klientit,Orë të përfunduara,Mësime të planifikuara,Totali i paguar,Statusi\n";
      candidateStats.forEach((stat) => {
        csvContent += `"${stat.name}","${stat.clientNumber}",${
          formatNumber(stat.completedHours)
        },${stat.scheduledLessons},${formatCurrency(stat.totalPaid)},${
          stat.status
        }\n`;
      });
      csvContent += "\n";

      // 4. Car Usage
      csvContent += "=== PËRDORIMI I MAKINAVE ===\n";
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
        "Modeli,Targat,Orë gjithsej,Përdorim i fundit,Inspektimi tjetër,Statusi\n";
      carStats.forEach((stat) => {
        csvContent += `"${stat.model}","${stat.licensePlate}",${formatNumber(stat.totalHours)},${formatNumber(stat.recentUsage)},"${stat.nextInspection}",${stat.status}\n`;
      });
      csvContent += "\n";

      // 5. Payment Summary
      csvContent += "=== PËRMBLEDHJE PAGESASH SIPAS MUAJIT ===\n";
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

      csvContent += "Muaji,Totali,Transaksione,Bankë,Para në dorë\n";
      monthlyData.forEach((data) => {
        const monthName = new Date(data.month + "-01").toLocaleDateString(
          "sq-AL",
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

      toast("success", "Raportet u eksportuan me sukses");
    } catch (error) {
      console.error("Error exporting reports:", error);
      toast("error", "Dështoi eksportimi i raporteve");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Duke ngarkuar raportet...</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raportet</h1>
          <p className="text-gray-500 mt-1">
            Shikoni dhe eksportoni raporte për të gjitha entitetet.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={<DownloadIcon className="w-4 h-4" />}
            onClick={handleExportAll}
          >
            Eksporto CSV
          </Button>
          <Button
            variant="primary"
            icon={<DownloadIcon className="w-4 h-4" />}
            onClick={() => setShowCandidateExportModal(true)}
          >
            Eksporto Kandidat
          </Button>
          <Button
            variant="primary"
            icon={<DownloadIcon className="w-4 h-4" />}
            onClick={() => setShowInstructorExportModal(true)}
          >
            Eksporto Instruktor
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
              <p className="text-sm text-gray-500">Kandidatët gjithsej</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCandidates}
              </p>
              <p className="text-xs text-green-600">
                {activeCandidates} aktivë
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
              <p className="text-sm text-gray-500">Të ardhurat gjithsej</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-xs text-gray-500">
                {filteredPayments.length} transaksione
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
              <p className="text-sm text-gray-500">Orë të mësuara</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalHours)}h</p>
              <p className="text-xs text-gray-500">
                {
                  filteredAppointments.filter((a) => a.status === "completed")
                    .length
                }{" "}
                mësime
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
              <p className="text-sm text-gray-500">Makinat aktive</p>
              <p className="text-2xl font-bold text-gray-900">
                {cars.filter((c) => !c.status || c.status === "active").length}
              </p>
              <p className="text-xs text-gray-500">nga {cars.length} gjithsej</p>
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
                label="Nga data"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Input
                label="Deri në datë"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Pastro
            </Button>
          )}
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs defaultTab="instructors">
        <TabList>
          <Tab value="instructors">Performanca e instruktorëve</Tab>
          <Tab value="candidates">Ecuria e kandidatëve</Tab>
          <Tab value="cars">Përdorimi i makinave</Tab>
          <Tab value="payments">Përmbledhje pagesash</Tab>
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
        name: `${firstName} ${lastName}`.trim() || "I panjohur",
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
      let csvContent = BOM + "=== PERFORMANCA E INSTRUKTORËVE ===\n";
      csvContent += "Instruktori,Lloji,Orë të mësuara,Paga për orë,Pagesa totale,Mësime të përfunduara,Nxënës aktivë,Nxënës gjithsej,Statusi\n";
      instructorStats.forEach((stat) => {
        const type = stat.instructorType === 'outsider' ? 'Me orë' : 'Rrogë fikse';
        const ratePerHour = stat.instructorType === 'outsider' ? formatCurrency(stat.ratePerHour || 0) : '-';
        const totalCredits = stat.instructorType === 'outsider' ? formatCurrency(stat.totalCredits || 0) : '-';
        csvContent += `"${stat.name}","${type}",${formatNumber(stat.totalHours)},"${ratePerHour}","${totalCredits}",${stat.completedLessons},${stat.activeCandidates},${stat.totalCandidates},${stat.status}\n`;
      });

      const filename = `performanca-instruktoreve_${timestamp}.csv`;
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
      doc.text('Performanca e Instruktorëve', 14, 20);
      doc.setFontSize(10);
      doc.text(`Data e eksportit: ${new Date().toLocaleDateString('sq-AL')}`, 14, 30);
      
      let yPos = 40;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Instruktori', 14, yPos);
      doc.text('Lloji', 50, yPos);
      doc.text('Orë', 70, yPos);
      doc.text('Paga/orë', 85, yPos);
      doc.text('Pagesa', 110, yPos);
      doc.text('Mësime', 135, yPos);
      doc.text('Nx. aktivë', 155, yPos);
      doc.text('Nx. gjithsej', 180, yPos);
      
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
          doc.text('Instruktori', 14, yPos);
          doc.text('Lloji', 50, yPos);
          doc.text('Orë', 70, yPos);
          doc.text('Paga/orë', 85, yPos);
          doc.text('Pagesa', 110, yPos);
          doc.text('Mësime', 135, yPos);
          doc.text('Nx. aktivë', 155, yPos);
          doc.text('Nx. gjithsej', 180, yPos);
          yPos += 8;
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
        }
        doc.text(stat.name.substring(0, 15), 14, yPos);
        doc.text(stat.instructorType === 'outsider' ? 'Me orë' : 'Rrogë', 50, yPos);
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
      
      doc.save(`performanca-instruktoreve_${timestamp}.pdf`);
    }
    
    toast("success", "Raporti u eksportua me sukses");
  };
  const columns = [
    {
      key: "name",
      label: "Instruktori",
      sortable: true,
    },
    {
      key: "instructorType",
      label: "Lloji",
      sortable: true,
      render: (value: unknown) => {
        const type = value as 'insider' | 'outsider';
        return (
          <Badge variant={type === 'outsider' ? 'info' : 'outline'} size="sm">
            {type === 'outsider' ? 'Me orë' : 'Rrogë fikse'}
          </Badge>
        );
      },
    },
    {
      key: "totalHours",
      label: "Orë të mësuara",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{formatNumber(value as number)}h</span>
      ),
    },
    {
      key: "ratePerHour",
      label: "Paga për orë",
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
      label: "Pagesa totale",
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
      label: "Mësime",
      sortable: true,
    },
    {
      key: "activeCandidates",
      label: "Nxënës aktivë",
      sortable: true,
    },
    {
      key: "totalCandidates",
      label: "Nxënës gjithsej",
      sortable: true,
    },
    {
      key: "status",
      label: "Statusi",
      render: (value: unknown) => (
        <Badge variant={value === "active" ? "success" : "danger"} dot>
          {value === "active" ? "Aktiv" : (value as string)}
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
            { value: 'csv', label: 'CSV' },
            { value: 'pdf', label: 'PDF' },
          ]}
          className="w-32"
        />
        <Button
          variant="outline"
          icon={<DownloadIcon className="w-4 h-4" />}
          onClick={handleExport}
        >
          Eksporto {exportFormat.toUpperCase()}
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
      label: "Kandidati",
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
      label: "Orë të përfunduara",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{formatNumber(value as number)}h</span>
      ),
    },
    {
      key: "scheduledLessons",
      label: "Të planifikuara",
      sortable: true,
    },
    {
      key: "totalPaid",
      label: "Totali i paguar",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: "status",
      label: "Statusi",
      render: (value: unknown) => (
        <Badge variant={value === "active" ? "success" : "danger"} dot>
          {value === "active" ? "Aktiv" : (value as string)}
        </Badge>
      ),
    },
  ];
  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    
    if (exportFormat === 'csv') {
      const BOM = "\uFEFF";
      let csvContent = BOM + "=== ECURIA E KANDIDATËVE ===\n";
      csvContent += "Kandidati,Numri i klientit,Orë të përfunduara,Mësime të planifikuara,Totali i paguar,Statusi\n";
      candidateStats.forEach((stat) => {
        csvContent += `"${stat.name}","${stat.clientNumber}",${formatNumber(stat.completedHours)},${stat.scheduledLessons},${formatCurrency(stat.totalPaid)},${stat.status}\n`;
      });

      const filename = `ecuria-kandidateve_${timestamp}.csv`;
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
      doc.text('Ecuria e Kandidatëve', 14, 20);
      doc.setFontSize(10);
      doc.text(`Data e eksportit: ${new Date().toLocaleDateString('sq-AL')}`, 14, 30);
      
      let yPos = 40;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Kandidati', 14, yPos);
      doc.text('Nr. Klientit', 60, yPos);
      doc.text('Orë', 95, yPos);
      doc.text('Mësime', 110, yPos);
      doc.text('Totali', 130, yPos);
      doc.text('Statusi', 170, yPos);
      
      yPos += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      candidateStats.forEach((stat) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(stat.name.substring(0, 20), 14, yPos);
        doc.text(stat.clientNumber || 'N/A', 60, yPos);
        doc.text(formatNumber(stat.completedHours), 95, yPos);
        doc.text(stat.scheduledLessons.toString(), 110, yPos);
        doc.text(formatCurrency(stat.totalPaid), 130, yPos);
        doc.text(stat.status === 'active' ? 'Aktiv' : stat.status, 170, yPos);
        yPos += 7;
      });
      
      doc.save(`ecuria-kandidateve_${timestamp}.pdf`);
    }
    
    toast("success", "Raporti u eksportua me sukses");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-3 items-center">
        <Select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
          options={[
            { value: 'csv', label: 'CSV' },
            { value: 'pdf', label: 'PDF' },
          ]}
          className="w-32"
        />
        <Button
          variant="outline"
          icon={<DownloadIcon className="w-4 h-4" />}
          onClick={handleExport}
        >
          Eksporto {exportFormat.toUpperCase()}
        </Button>
      </div>
      <Card padding="none">
        <DataTable
          data={candidateStats}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchable
          searchPlaceholder="Kërko kandidatë..."
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
      label: "Mjeti",
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
      label: "Orë gjithsej",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{formatNumber(value as number)}h</span>
      ),
    },
    {
      key: "recentUsage",
      label: "Përdorim i fundit",
      sortable: true,
      render: (value: unknown) => <span>{formatNumber(value as number)}h</span>,
    },
    {
      key: "nextInspection",
      label: "Inspektimi tjetër",
      sortable: true,
    },
    {
      key: "status",
      label: "Statusi",
      render: (value: unknown) => (
        <Badge variant={value === "active" ? "success" : "danger"} dot>
          {value === "active" ? "Aktiv" : (value as string)}
        </Badge>
      ),
    },
  ];
  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    
    if (exportFormat === 'csv') {
      const BOM = "\uFEFF";
      let csvContent = BOM + "=== PËRDORIMI I MAKINAVE ===\n";
      csvContent += "Modeli,Targat,Orë gjithsej,Përdorim i fundit,Inspektimi tjetër,Statusi\n";
      carStats.forEach((stat) => {
        csvContent += `"${stat.model}","${stat.licensePlate}",${formatNumber(stat.totalHours)},${formatNumber(stat.recentUsage)},"${stat.nextInspection}",${stat.status}\n`;
      });

      const filename = `perdorimi-makinave_${timestamp}.csv`;
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
      doc.text('Përdorimi i Makinave', 14, 20);
      doc.setFontSize(10);
      doc.text(`Data e eksportit: ${new Date().toLocaleDateString('sq-AL')}`, 14, 30);
      
      let yPos = 40;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Modeli', 14, yPos);
      doc.text('Targat', 60, yPos);
      doc.text('Orë gjithsej', 95, yPos);
      doc.text('Përdorim', 130, yPos);
      doc.text('Inspektimi', 160, yPos);
      doc.text('Statusi', 190, yPos);
      
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
        doc.text(stat.nextInspection || 'N/A', 160, yPos);
        doc.text(stat.status === 'active' ? 'Aktiv' : stat.status, 190, yPos);
        yPos += 7;
      });
      
      doc.save(`perdorimi-makinave_${timestamp}.pdf`);
    }
    
    toast("success", "Raporti u eksportua me sukses");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-3 items-center">
        <Select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
          options={[
            { value: 'csv', label: 'CSV' },
            { value: 'pdf', label: 'PDF' },
          ]}
          className="w-32"
        />
        <Button
          variant="outline"
          icon={<DownloadIcon className="w-4 h-4" />}
          onClick={handleExport}
        >
          Eksporto {exportFormat.toUpperCase()}
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
      label: "Muaji",
      sortable: true,
      render: (value: unknown) => {
        const date = new Date((value as string) + "-01");
        return date.toLocaleDateString("sq-AL", {
          year: "numeric",
          month: "long",
        });
      },
    },
    {
      key: "total",
      label: "Totali",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-green-600">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: "count",
      label: "Transaksione",
      sortable: true,
    },
    {
      key: "bank",
      label: "Bankë",
      render: (value: unknown) => <span>{formatCurrency(value as number)}</span>,
    },
    {
      key: "cash",
      label: "Para në dorë",
      render: (value: unknown) => <span>{formatCurrency(value as number)}</span>,
    },
  ];
  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    
    if (exportFormat === 'csv') {
      const BOM = "\uFEFF";
      let csvContent = BOM + "=== PËRMBLEDHJE PAGESASH SIPAS MUAJIT ===\n";
      csvContent += "Muaji,Totali,Transaksione,Bankë,Para në dorë\n";
      monthlyData.forEach((data) => {
        const monthName = new Date(data.month + "-01").toLocaleDateString(
          "sq-AL",
          {
            year: "numeric",
            month: "long",
          }
        );
        csvContent += `"${monthName}",${formatCurrency(data.total)},${data.count},${formatCurrency(data.bank)},${formatCurrency(data.cash)}\n`;
      });

      const filename = `permbledhje-pagesash_${timestamp}.csv`;
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
      doc.text('Përmbledhje Pagesash', 14, 20);
      doc.setFontSize(10);
      doc.text(`Data e eksportit: ${new Date().toLocaleDateString('sq-AL')}`, 14, 30);
      
      let yPos = 40;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Muaji', 14, yPos);
      doc.text('Totali', 70, yPos);
      doc.text('Transaksione', 100, yPos);
      doc.text('Bankë', 140, yPos);
      doc.text('Para në dorë', 170, yPos);
      
      yPos += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      monthlyData.forEach((data) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const monthName = new Date(data.month + "-01").toLocaleDateString(
          "sq-AL",
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
      
      doc.save(`permbledhje-pagesash_${timestamp}.pdf`);
    }
    
    toast("success", "Raporti u eksportua me sukses");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-3 items-center">
        <Select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
          options={[
            { value: 'csv', label: 'CSV' },
            { value: 'pdf', label: 'PDF' },
          ]}
          className="w-32"
        />
        <Button
          variant="outline"
          icon={<DownloadIcon className="w-4 h-4" />}
          onClick={handleExport}
        >
          Eksporto {exportFormat.toUpperCase()}
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
