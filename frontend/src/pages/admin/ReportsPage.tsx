import React, { useState, useMemo, useEffect } from "react";
import {
  DownloadIcon,
  UsersIcon,
  CarIcon,
  CreditCardIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { Tabs, TabList, Tab, TabPanel } from "../../components/ui/Tabs";
import { DataTable } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { api } from "../../utils/api";
import { toast } from "../../hooks/useToast";

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

      let csvContent = "Driving School Management - Complete Reports Export\n";
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      if (dateFrom || dateTo) {
        csvContent += `Date Range: ${dateFrom || "All"} to ${
          dateTo || "All"
        }\n`;
      }
      csvContent += "\n";

      // 1. Summary Stats
      csvContent += "=== SUMMARY STATISTICS ===\n";
      csvContent += `Total Candidates,${totalCandidates}\n`;
      csvContent += `Active Candidates,${activeCandidates}\n`;
      csvContent += `Total Revenue,$${totalRevenue.toLocaleString()}\n`;
      csvContent += `Total Hours Taught,${totalHours}\n`;
      csvContent += `Active Cars,${
        cars.filter((c) => !c.status || c.status === "active").length
      }\n`;
      csvContent += `Total Cars,${cars.length}\n`;
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
          return {
            name: `${firstName} ${lastName}`.trim() || "Unknown",
            totalHours,
            completedLessons: completedAppointments.length,
            activeCandidates: instructorCandidates.filter(
              (c) => !c.status || c.status === "active"
            ).length,
            totalCandidates: instructorCandidates.length,
            status: instructor.status || "active",
          };
        });

      csvContent +=
        "Instructor,Hours Taught,Completed Lessons,Active Students,Total Students,Status\n";
      instructorStats.forEach((stat) => {
        csvContent += `"${stat.name}",${stat.totalHours},${stat.completedLessons},${stat.activeCandidates},${stat.totalCandidates},${stat.status}\n`;
      });
      csvContent += "\n";

      // 3. Candidate Progress
      csvContent += "=== CANDIDATE PROGRESS ===\n";
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
        "Candidate,Client Number,Hours Completed,Scheduled Lessons,Total Paid,Status\n";
      candidateStats.forEach((stat) => {
        csvContent += `"${stat.name}","${stat.clientNumber}",${
          stat.completedHours
        },${stat.scheduledLessons},$${stat.totalPaid.toFixed(2)},${
          stat.status
        }\n`;
      });
      csvContent += "\n";

      // 4. Car Usage
      csvContent += "=== CAR USAGE ===\n";
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
        "Vehicle Model,License Plate,Total Hours,Recent Usage,Next Inspection,Status\n";
      carStats.forEach((stat) => {
        csvContent += `"${stat.model}","${stat.licensePlate}",${stat.totalHours},${stat.recentUsage},"${stat.nextInspection}",${stat.status}\n`;
      });
      csvContent += "\n";

      // 5. Payment Summary
      csvContent += "=== PAYMENT SUMMARY BY MONTH ===\n";
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

      csvContent += "Month,Total,Transactions,Bank,Cash\n";
      monthlyData.forEach((data) => {
        const monthName = new Date(data.month + "-01").toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
          }
        );
        csvContent += `"${monthName}",$${data.total.toFixed(2)},${
          data.count
        },$${data.bank.toFixed(2)},$${data.cash.toFixed(2)}\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast("success", "Reports exported successfully");
    } catch (error) {
      console.error("Error exporting reports:", error);
      toast("error", "Failed to export reports");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading reports...</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">
            View and export reports for all entities.
          </p>
        </div>
        <Button
          variant="outline"
          icon={<DownloadIcon className="w-4 h-4" />}
          onClick={handleExportAll}
        >
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
                {filteredPayments.length} transactions
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
                {
                  filteredAppointments.filter((a) => a.status === "completed")
                    .length
                }{" "}
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
                {cars.filter((c) => !c.status || c.status === "active").length}
              </p>
              <p className="text-xs text-gray-500">of {cars.length} total</p>
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
                label="From Date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Input
                label="To Date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs defaultTab="instructors">
        <TabList>
          <Tab value="instructors">Instructor Performance</Tab>
          <Tab value="candidates">Candidate Progress</Tab>
          <Tab value="cars">Car Usage</Tab>
          <Tab value="payments">Payment Summary</Tab>
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
      return {
        id: instructorId,
        name: `${firstName} ${lastName}`.trim() || "Unknown",
        totalHours,
        completedLessons: completedAppointments.length,
        activeCandidates: instructorCandidates.filter(
          (c) => !c.status || c.status === "active"
        ).length,
        totalCandidates: instructorCandidates.length,
        status: instructor.status || "active",
      };
    });
  const columns = [
    {
      key: "name",
      label: "Instructor",
      sortable: true,
    },
    {
      key: "totalHours",
      label: "Hours Taught",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{value as number}h</span>
      ),
    },
    {
      key: "completedLessons",
      label: "Lessons",
      sortable: true,
    },
    {
      key: "activeCandidates",
      label: "Active Students",
      sortable: true,
    },
    {
      key: "totalCandidates",
      label: "Total Students",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => (
        <Badge variant={value === "active" ? "success" : "danger"} dot>
          {value as string}
        </Badge>
      ),
    },
  ];
  return (
    <Card padding="none">
      <DataTable
        data={instructorStats}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable={false}
        pagination={false}
      />
    </Card>
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
      label: "Candidate",
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
      label: "Hours Completed",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{value as number}h</span>
      ),
    },
    {
      key: "scheduledLessons",
      label: "Scheduled",
      sortable: true,
    },
    {
      key: "totalPaid",
      label: "Total Paid",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">${value as number}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => (
        <Badge variant={value === "active" ? "success" : "danger"} dot>
          {value as string}
        </Badge>
      ),
    },
  ];
  return (
    <Card padding="none">
      <DataTable
        data={candidateStats}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable
        searchPlaceholder="Search candidates..."
        searchKeys={["name", "clientNumber"]}
      />
    </Card>
  );
}
function CarUsageReport({
  filteredAppointments,
  cars,
}: {
  filteredAppointments: Appointment[];
  cars: Car[];
}) {
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
      label: "Vehicle",
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
      label: "Total Hours",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold">{value as number}h</span>
      ),
    },
    {
      key: "recentUsage",
      label: "Recent Usage",
      sortable: true,
      render: (value: unknown) => <span>{value as number}h</span>,
    },
    {
      key: "nextInspection",
      label: "Next Inspection",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => (
        <Badge variant={value === "active" ? "success" : "danger"} dot>
          {value as string}
        </Badge>
      ),
    },
  ];
  return (
    <Card padding="none">
      <DataTable
        data={carStats}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable={false}
        pagination={false}
      />
    </Card>
  );
}
function PaymentSummaryReport({
  filteredPayments,
}: {
  filteredPayments: Payment[];
}) {
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
      label: "Month",
      sortable: true,
      render: (value: unknown) => {
        const date = new Date((value as string) + "-01");
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      },
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-green-600">${value as number}</span>
      ),
    },
    {
      key: "count",
      label: "Transactions",
      sortable: true,
    },
    {
      key: "bank",
      label: "Bank",
      render: (value: unknown) => <span>${value as number}</span>,
    },
    {
      key: "cash",
      label: "Cash",
      render: (value: unknown) => <span>${value as number}</span>,
    },
  ];
  return (
    <Card padding="none">
      <DataTable
        data={monthlyData}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchable={false}
        pagination={false}
      />
    </Card>
  );
}
