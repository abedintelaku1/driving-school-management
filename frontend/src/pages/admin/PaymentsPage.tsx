import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, DownloadIcon, EditIcon, TrashIcon, FileTextIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { TextArea } from "../../components/ui/TextArea";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useLanguage } from "../../hooks/useLanguage";
import type { Payment, Candidate, Package } from "../../types";
import { toast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../utils/api";
import jsPDF from "jspdf";
import { formatCurrentDate, formatDate } from "../../utils/dateUtils";

// Helper function to translate package names
const getTranslatedPackageName = (packageName: string, t: (key: string) => string): string => {
  const nameLower = packageName.toLowerCase();
  
  // Map common package names to translation keys
  if (nameLower.includes('premium')) {
    return t('packages.premium');
  }
  if (nameLower.includes('standard')) {
    return t('packages.standard');
  }
  if (nameLower.includes('basic')) {
    return t('packages.basic');
  }
  
  // If no match found, return original name
  return packageName;
};

type PaymentRow = {
  id: string;
  candidateId:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        uniqueClientNumber?: string;
      };
  packageId?: string | { _id: string; name: string; price: number } | null;
  amount: number;
  method: "bank" | "cash";
  date: string;
  notes?: string;
  createdAt: string;
  addedBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    // email is not returned by the API for security
  } | null;
};

export function PaymentsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 0;
  const isStaff = user?.role === 2;
  const canAddPayment = isAdmin || isStaff; // Staff: ✅ shtim pagesash
  const canEditPayment = isAdmin; // Staff: ❌ editim
  const canDeletePayment = isAdmin; // Staff: ❌ fshirje / minusim

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(
    null,
  );
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");

  // Fetch payments, candidates, and packages from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, candidatesRes, packagesRes] = await Promise.all([
          api.listPayments(),
          api.listCandidates(),
          api.listPackages(),
        ]);

        if (paymentsRes.ok && paymentsRes.data) {
          // Transform MongoDB data to frontend format
          const mapped = (paymentsRes.data as any[]).map((item) => {
            // Handle candidateId - can be object (populated) or string
            const candidateIdValue = typeof item.candidateId === 'object' && item.candidateId !== null
              ? item.candidateId._id || item.candidateId.id || ""
              : item.candidateId || "";
            
            // Handle packageId - keep as is (string or null)
            const packageIdValue = item.packageId || null;
            
            // Handle addedBy - can be object (populated) or string/null
            // Backend populates addedBy with firstName, lastName (email is excluded for security)
            // If addedBy is null or undefined, keep it as null
            // If addedBy is an object with properties, keep it as object
            const addedByValue = item.addedBy && typeof item.addedBy === 'object' && item.addedBy !== null && ('firstName' in item.addedBy || 'lastName' in item.addedBy)
              ? item.addedBy
              : null;
            
            return {
              id: item._id || item.id,
              candidateId: candidateIdValue,
              candidate: typeof item.candidateId === 'object' && item.candidateId !== null ? item.candidateId : null, // Keep full candidate object if populated
              packageId: packageIdValue,
              amount: item.amount || 0,
              method: item.method || "cash",
              date: item.date
                ? new Date(item.date).toISOString().split("T")[0]
                : "",
              notes: item.notes || "",
              createdAt: item.createdAt
                ? new Date(item.createdAt).toISOString().split("T")[0]
                : "",
              addedBy: addedByValue, // Keep full user object if populated
            };
          });
          setPayments(mapped);
        } else {
          toast("error", t('payments.failedToLoad'));
        }

        if (candidatesRes.ok && candidatesRes.data) {
          // Transform candidates data
          const mappedCandidates = (candidatesRes.data as any[]).map(
            (item) => ({
              id: item._id || item.id,
              firstName: item.firstName || "",
              lastName: item.lastName || "",
              email: item.email || "",
              phone: item.phone || "",
              dateOfBirth: item.dateOfBirth || "",
              personalNumber: item.personalNumber || "",
              address: item.address || "",
              packageId: item.packageId || "",
              carId: item.carId || "",
              paymentFrequency: item.paymentFrequency || "",
              status: item.status || "active",
              instructorId:
                item.instructor?._id ||
                item.instructor ||
                item.instructorId ||
                "",
              uniqueClientNumber: item.uniqueClientNumber || "",
            }),
          );
          setCandidates(mappedCandidates as Candidate[]);
        }

        if (packagesRes.ok && packagesRes.data) {
          // Transform packages data
          const mappedPackages = (packagesRes.data as any[]).map((item) => ({
            id: item._id || item.id,
            name: item.name || "",
            category: item.category || "",
            numberOfHours: item.numberOfHours || 0,
            price: item.price || 0,
            description: item.description || "",
            status: item.status || "active",
            createdAt: item.createdAt || "",
            updatedAt: item.updatedAt || "",
          }));
          setPackages(mappedPackages as Package[]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast("error", t('common.failedToLoadData'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  // Helper function to get candidate info
  const getCandidateInfo = (
    candidateId:
      | string
      | {
          _id: string;
          firstName: string;
          lastName: string;
          uniqueClientNumber?: string;
        },
  ) => {
    if (typeof candidateId === "object" && candidateId !== null) {
      return candidateId;
    }
    return candidates.find((c) => c.id === candidateId);
  };

  // Helper function to get package info from API data
  const getPackageInfo = (
    packageId:
      | string
      | { _id: string; name: string; price: number }
      | null
      | undefined,
  ) => {
    if (!packageId) return null;
    // If it's already an object (populated), use it
    if (
      typeof packageId === "object" &&
      packageId !== null &&
      "name" in packageId
    ) {
      return packageId;
    }
    // Otherwise, get from packages state (from API)
    if (typeof packageId === "string") {
      return packages.find((pkg) => pkg.id === packageId) || null;
    }
    return null;
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Method filter
      if (methodFilter && payment.method !== methodFilter) return false;

      // Date filters
      if (dateFrom && payment.date < dateFrom) return false;
      if (dateTo && payment.date > dateTo) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const candidate = getCandidateInfo(payment.candidateId);
        const candidateName =
          candidate && typeof candidate === "object" && "firstName" in candidate
            ? `${candidate.firstName} ${candidate.lastName}`.toLowerCase()
            : "";
        const candidateNumber =
          candidate &&
          typeof candidate === "object" &&
          "uniqueClientNumber" in candidate
            ? (candidate.uniqueClientNumber || "").toLowerCase()
            : "";
        const pkg = getPackageInfo(payment.packageId);
        const packageName = pkg ? getTranslatedPackageName(pkg.name, t).toLowerCase() : "";
        const amount = payment.amount.toString();
        const method = payment.method.toLowerCase();
        const notes = (payment.notes || "").toLowerCase();

        const matchesSearch =
          candidateName.includes(query) ||
          candidateNumber.includes(query) ||
          packageName.includes(query) ||
          amount.includes(query) ||
          method.includes(query) ||
          notes.includes(query);

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [payments, methodFilter, dateFrom, dateTo, searchQuery, candidates]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  // Handle edit payment
  const handleEdit = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setShowEditModal(true);
  };

  // Handle delete payment
  const handleDelete = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedPayment) return;

    try {
      const { ok, data } = await api.deletePayment(selectedPayment.id);
      if (ok) {
        toast("success", t('payments.paymentDeleted'));
        setRefreshKey((prev) => prev + 1);
        setShowDeleteModal(false);
        setSelectedPayment(null);
      } else {
        toast("error", (data as any)?.message || t('payments.failedToDelete'));
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast("error", t('payments.failedToDelete'));
    }
  };

  // Handle export
  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];

    if (exportFormat === "csv") {
      // Create CSV content
      const headers = [
        t('payments.dateColumn'),
        t('payments.candidateColumn'),
        t('payments.clientNumberColumn'),
        t('payments.packageColumn'),
        t('payments.amountColumn'),
        t('payments.methodColumn'),
        t('payments.notesColumn'),
      ];
      const rows = filteredPayments.map((payment) => {
        const candidate = getCandidateInfo(payment.candidateId);
        const candidateName =
          candidate && typeof candidate === "object" && "firstName" in candidate
            ? `${candidate.firstName} ${candidate.lastName}`
            : t('common.unknown');
        const candidateNumber =
          candidate &&
          typeof candidate === "object" &&
          "uniqueClientNumber" in candidate
            ? candidate.uniqueClientNumber || ""
            : "";
        const pkg = getPackageInfo(payment.packageId);
        const packageName = pkg ? getTranslatedPackageName(pkg.name, t) : "-";

        return [
          payment.date,
          candidateName,
          candidateNumber,
          packageName,
          payment.amount.toString(),
          payment.method === 'bank' ? t('payments.bank') : t('payments.cash'),
          (payment.notes || "").replace(/"/g, '""'), // Escape quotes in CSV
        ];
      });

      // Convert to CSV format
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${t('payments.csvFilename')}_${timestamp}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast("success", t('payments.exportedToCSV'));
    } else {
      // PDF Export
      const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
      const locale = localeMap[language] || 'sq-AL';
      
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(t('payments.title'), 14, 20);
      doc.setFontSize(10);
      doc.text(
        `${t('reports.exportDate')}: ${formatCurrentDate(locale)}`,
        14,
        30,
      );
      doc.text(`${t('common.total')}: ${filteredPayments.length} ${t('payments.payments')}`, 14, 37);

      // Calculate total amount
      const totalAmount = filteredPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      doc.text(`${t('payments.totalPaid')}: ${totalAmount.toFixed(2)} EUR`, 14, 44);

      let yPos = 55;
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text(t('payments.dateColumn'), 14, yPos);
      doc.text(t('payments.candidateColumn'), 40, yPos);
      doc.text(t('payments.clientNumberColumn'), 85, yPos);
      doc.text(t('payments.packageColumn'), 120, yPos);
      doc.text(t('payments.amountColumn'), 150, yPos);
      doc.text(t('payments.methodColumn'), 175, yPos);

      yPos += 7;
      doc.setFont(undefined, "normal");
      doc.setFontSize(8);

      filteredPayments.forEach((payment) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const candidate = getCandidateInfo(payment.candidateId);
        const candidateName =
          candidate && typeof candidate === "object" && "firstName" in candidate
            ? `${candidate.firstName} ${candidate.lastName}`
            : t('common.unknown');
        const candidateNumber =
          candidate &&
          typeof candidate === "object" &&
          "uniqueClientNumber" in candidate
            ? candidate.uniqueClientNumber || ""
            : "";
        const pkg = getPackageInfo(payment.packageId);
        const packageName = pkg ? getTranslatedPackageName(pkg.name, t).substring(0, 12) : "-";
        const method = payment.method === 'bank' ? t('payments.bank') : t('payments.cash');

        doc.text(payment.date.substring(0, 10), 14, yPos);
        doc.text(candidateName.substring(0, 20), 40, yPos);
        doc.text(candidateNumber.substring(0, 12), 85, yPos);
        doc.text(packageName, 120, yPos);
        doc.text(`${payment.amount.toFixed(2)} EUR`, 150, yPos);
        doc.text(method, 175, yPos);
        yPos += 6;
      });

      doc.save(`${t('payments.pdfFilename')}_${timestamp}.pdf`);
      toast("success", t('payments.exportedToPDF'));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setMethodFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
  };

  const columns = [
    {
      key: "date",
      label: t('payments.dateColumn'),
      sortable: true,
    },
    {
      key: "candidateId",
      label: t('payments.candidateColumn'),
      render: (value: unknown) => {
        const candidate = getCandidateInfo(value as any);
        if (
          typeof candidate === "object" &&
          candidate !== null &&
          "firstName" in candidate
        ) {
          return (
            <div>
              <p className="font-medium text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {candidate.uniqueClientNumber || ""}
              </p>
            </div>
          );
        }
        return <span className="text-gray-400">{t('payments.unknown')}</span>;
      },
    },
    {
      key: "packageId",
      label: t('payments.packageColumn'),
      render: (value: unknown) => {
        const pkg = getPackageInfo(value as any);
        return pkg ? (
          <Badge variant="info">{getTranslatedPackageName(pkg.name, t)}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      key: "amount",
      label: t('payments.amountColumn'),
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">
          €{(value as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: "method",
      label: t('payments.methodColumn'),
      render: (value: unknown) => {
        const method = value as string;
        const translated = method === 'bank' ? t('payments.bank') : t('payments.cash');
        return (
          <Badge variant={value === "bank" ? "info" : "default"}>
            {translated}
          </Badge>
        );
      },
    },
    {
      key: "addedBy",
      label: t('payments.addedByColumn'),
      render: (value: unknown) => {
        // Check if value is a valid user object with at least one property
        if (!value || typeof value !== "object" || value === null) {
          return <span className="text-gray-400">—</span>;
        }
        const user = value as { firstName?: string; lastName?: string; _id?: string };
        // Check if it has at least one user property
        if (!('firstName' in user || 'lastName' in user)) {
          return <span className="text-gray-400">—</span>;
        }
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
        return (
          <span className="text-gray-700 font-medium">
            {name || t('payments.unknown')}
          </span>
        );
      },
    },
    {
      key: "notes",
      label: t('payments.notesColumn'),
      render: (value: unknown) => (
        <span className="text-gray-500 truncate max-w-[200px] block">
          {(value as string) || "-"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('payments.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('payments.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2 items-center">
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as "csv" | "pdf")}
              options={[
                { value: "csv", label: t('reports.csv') },
                { value: "pdf", label: t('reports.pdf') },
              ]}
              placeholder={t('common.selectOption')}
              className="w-24"
            />
            <Button
              variant="outline"
              icon={<DownloadIcon className="w-4 h-4" />}
              onClick={handleExport}
              disabled={filteredPayments.length === 0}
            >
              {exportFormat === 'csv' ? t('payments.exportCSV') : t('payments.exportPDF')}
            </Button>
          </div>
          {canAddPayment && (
            <Button
              onClick={() => setShowAddModal(true)}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              {t('payments.addPayment')}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">{t('payments.totalCollectedFiltered')}</p>
            <p className="text-4xl font-bold mt-1">
              €{totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100">{t('payments.transactions')}</p>
            <p className="text-4xl font-bold mt-1">{filteredPayments.length}</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card padding="sm">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label={t('common.search')}
                placeholder={t('payments.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                label={t('payments.paymentMethod')}
                placeholder={t('payments.allMethods')}
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                options={[
                  { value: "", label: t('payments.allMethods') },
                  { value: "bank", label: t('payments.bank') },
                  { value: "cash", label: t('payments.cash') },
                ]}
              />
            </div>
            <div className="w-40">
              <Input
                label={t('payments.fromDate')}
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Input
                label={t('payments.toDate')}
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {(methodFilter || dateFrom || dateTo || searchQuery) && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                {t('common.clear')} {t('common.filters')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredPayments}
          columns={columns}
          keyExtractor={(payment) => payment.id}
          searchable={false}
          emptyMessage={t('common.noData')}
          actions={
            canEditPayment || canDeletePayment || isStaff
              ? (payment) => {
                  const candidate = getCandidateInfo(payment.candidateId);
                  const candidateId = payment.candidateId;
                  
                  return (
                    <div className="flex items-center justify-end gap-2">
                      {canEditPayment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(payment);
                          }}
                          icon={<EditIcon className="w-4 h-4" />}
                        >
                          <span className="hidden sm:inline">{t('common.edit')}</span>
                        </Button>
                      )}
                      {canDeletePayment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(payment);
                          }}
                          icon={<TrashIcon className="w-4 h-4" />}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <span className="hidden sm:inline">{t('common.delete')}</span>
                        </Button>
                      )}
                      {isStaff && candidateId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/candidates/${candidateId}?tab=documents`);
                          }}
                          icon={<FileTextIcon className="w-4 h-4" />}
                          className="text-green-600 hover:text-green-700"
                        >
                          <span className="hidden sm:inline">{t('payments.documents')}</span>
                        </Button>
                      )}
                    </div>
                  );
                }
              : undefined
          }
        />
      </Card>

      {/* Add Modal */}
      <AddPaymentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          toast("success", t('payments.paymentAdded'));
          setShowAddModal(false);
        }}
        candidates={candidates}
        packages={packages}
      />

      {/* Edit Modal */}
      <EditPaymentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPayment(null);
        }}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          toast("success", t('payments.paymentUpdated'));
          setShowEditModal(false);
          setSelectedPayment(null);
        }}
        candidates={candidates}
        packages={packages}
        payment={selectedPayment}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPayment(null);
        }}
        onConfirm={confirmDelete}
        payment={selectedPayment}
      />
    </div>
  );
}

type AddPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidates: Candidate[];
  packages: Package[];
};

function AddPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  candidates,
  packages,
}: AddPaymentModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    candidateId: "",
    amount: "",
    method: "",
    date: new Date().toISOString().split("T")[0],
    packageId: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        candidateId: "",
        amount: "",
        method: "",
        date: new Date().toISOString().split("T")[0],
        packageId: "",
        notes: "",
      });
    }
  }, [isOpen]);

  const selectedCandidate = formData.candidateId
    ? candidates.find((c) => c.id === formData.candidateId)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.candidateId) {
      toast("error", t('payments.pleaseSelectCandidate'));
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast("error", t('payments.pleaseEnterValidAmount'));
      return;
    }
    if (!formData.method) {
      toast("error", t('payments.pleaseSelectPaymentMethod'));
      return;
    }
    if (!formData.date) {
      toast("error", t('payments.pleaseSelectDate'));
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        candidateId: formData.candidateId,
        amount: parseFloat(formData.amount),
        method: formData.method as "bank" | "cash",
        date: formData.date,
        packageId: formData.packageId || selectedCandidate?.packageId || null,
        notes: formData.notes || "",
      };

      const { ok, data, status } = await api.createPayment(paymentData);

      if (ok) {
        console.log("Payment created successfully:", data);
        onSuccess();
      } else {
        console.error("Failed to create payment:", { status, data });
        const errorMessage =
          (data as any)?.message ||
          `Dështoi regjistrimi i pagesës (Status: ${status})`;
        toast("error", errorMessage);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast(
        "error",
        t('payments.failedToRegister'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('payments.addPaymentTitle')}
      description={t('payments.enterPaymentDetails')}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {t('payments.registerPayment')}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Select
          label={t('payments.candidate')}
          required
          value={formData.candidateId}
          onChange={(e) => {
            const candidate = candidates.find((c) => c.id === e.target.value);
            setFormData({
              ...formData,
              candidateId: e.target.value,
              packageId: candidate?.packageId || "", // Auto-set package from candidate
            });
          }}
          placeholder={t('common.selectOption')}
          options={candidates.map((candidate) => ({
            value: candidate.id,
            label: `${candidate.firstName} ${candidate.lastName} ${
              candidate.uniqueClientNumber
                ? `(${candidate.uniqueClientNumber})`
                : ""
            }`,
          }))}
        />

        {selectedCandidate &&
          selectedCandidate.packageId &&
          (() => {
            const packageInfo = packages.find(
              (pkg) => pkg.id === selectedCandidate.packageId,
            );
            return packageInfo ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {t('payments.candidatePackage')}
                    </p>
                    <p className="text-lg font-semibold text-blue-900 mt-1">
                      {getTranslatedPackageName(packageInfo.name, t)}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {packageInfo.numberOfHours} {t('payments.hours')} • €
                      {packageInfo.price.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="info">{packageInfo.category}</Badge>
                </div>
              </div>
            ) : selectedCandidate.packageId ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {t('payments.packageIdNotFound', { packageId: selectedCandidate.packageId })}
                </p>
              </div>
            ) : null;
          })()}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('payments.amount')}
            type="number"
            required
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: e.target.value,
              })
            }
            placeholder={t('payments.amountPlaceholder')}
          />
          <Input
            label={t('payments.date')}
            type="date"
            required
            value={formData.date}
            onChange={(e) =>
              setFormData({
                ...formData,
                date: e.target.value,
              })
            }
          />
        </div>

        <Select
          label={t('payments.method')}
          required
          value={formData.method}
          onChange={(e) =>
            setFormData({
              ...formData,
              method: e.target.value,
            })
          }
          placeholder={t('common.selectOption')}
          options={[
            { value: "bank", label: t('payments.bankTransfer') },
            { value: "cash", label: t('payments.cashInHand') },
          ]}
        />

        <TextArea
          label={t('payments.notes')}
          value={formData.notes}
          onChange={(e) =>
            setFormData({
              ...formData,
              notes: e.target.value,
            })
          }
          placeholder={t('payments.notesPlaceholder')}
          rows={3}
        />
      </form>
    </Modal>
  );
}

type EditPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidates: Candidate[];
  packages: Package[];
  payment: PaymentRow | null;
};

function EditPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  candidates,
  packages,
  payment,
}: EditPaymentModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    candidateId: "",
    amount: "",
    method: "",
    date: new Date().toISOString().split("T")[0],
    packageId: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  // Populate form when payment is provided
  useEffect(() => {
    if (payment && isOpen) {
      const candidateId =
        typeof payment.candidateId === "object" &&
        payment.candidateId !== null &&
        "_id" in payment.candidateId
          ? payment.candidateId._id
          : typeof payment.candidateId === "string"
            ? payment.candidateId
            : "";

      setFormData({
        candidateId,
        amount: payment.amount.toString(),
        method: payment.method,
        date: payment.date,
        packageId:
          typeof payment.packageId === "string" ? payment.packageId : "",
        notes: payment.notes || "",
      });
    }
  }, [payment, isOpen]);

  const selectedCandidate = formData.candidateId
    ? candidates.find((c) => c.id === formData.candidateId)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;

    setLoading(true);
    try {
      const paymentData = {
        amount: parseFloat(formData.amount),
        method: formData.method as "bank" | "cash",
        date: formData.date,
        packageId: formData.packageId || null,
        notes: formData.notes || "",
      };

      const { ok, data } = await api.updatePayment(payment.id, paymentData);
      if (ok) {
        onSuccess();
      } else {
        toast(
          "error",
          (data as any)?.message || t('payments.failedToUpdate'),
        );
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast("error", t('payments.failedToUpdate'));
    } finally {
      setLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('payments.editPaymentTitle')}
      description={t('payments.updatePaymentDetails')}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {t('payments.updatePayment')}
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            {t('payments.candidateLabel')}{" "}
            <span className="font-medium text-gray-900">
              {selectedCandidate
                ? `${selectedCandidate.firstName} ${selectedCandidate.lastName}`
                : t('payments.unknown')}
            </span>
          </p>
        </div>

        {selectedCandidate &&
          selectedCandidate.packageId &&
          (() => {
            const packageInfo = packages.find(
              (pkg) => pkg.id === selectedCandidate.packageId,
            );
            return packageInfo ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {t('payments.candidatePackage')}
                    </p>
                    <p className="text-lg font-semibold text-blue-900 mt-1">
                      {getTranslatedPackageName(packageInfo.name, t)}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {packageInfo.numberOfHours} {t('payments.hours')} • €
                      {packageInfo.price.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="info">{packageInfo.category}</Badge>
                </div>
              </div>
            ) : selectedCandidate.packageId ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {t('payments.packageIdNotFound', { packageId: selectedCandidate.packageId })}
                </p>
              </div>
            ) : null;
          })()}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('payments.amount')}
            type="number"
            required
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: e.target.value,
              })
            }
            placeholder={t('payments.amountPlaceholder')}
          />
          <Input
            label={t('payments.date')}
            type="date"
            required
            value={formData.date}
            onChange={(e) =>
              setFormData({
                ...formData,
                date: e.target.value,
              })
            }
          />
        </div>

        <Select
          label={t('payments.method')}
          required
          value={formData.method}
          onChange={(e) =>
            setFormData({
              ...formData,
              method: e.target.value,
            })
          }
          placeholder={t('common.selectOption')}
          options={[
            { value: "bank", label: t('payments.bankTransfer') },
            { value: "cash", label: t('payments.cashInHand') },
          ]}
        />

        <TextArea
          label={t('payments.notes')}
          value={formData.notes}
          onChange={(e) =>
            setFormData({
              ...formData,
              notes: e.target.value,
            })
          }
          placeholder={t('payments.notesPlaceholder')}
          rows={3}
        />
      </form>
    </Modal>
  );
}

type DeleteConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payment: PaymentRow | null;
};

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  payment,
}: DeleteConfirmationModalProps) {
  const { t } = useLanguage();
  const getCandidateInfo = (
    candidateId:
      | string
      | {
          _id: string;
          firstName: string;
          lastName: string;
          uniqueClientNumber?: string;
        },
  ) => {
    if (typeof candidateId === "object" && candidateId !== null) {
      return candidateId;
    }
    return null;
  };

  if (!payment) return null;

  const candidate = getCandidateInfo(payment.candidateId);
  const candidateName =
    candidate && "firstName" in candidate
      ? `${candidate.firstName} ${candidate.lastName}`
      : t('payments.unknown');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('payments.deletePaymentTitle')}
      description={t('payments.deletePaymentDescription')}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {t('common.delete')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">
            {t('payments.warning')}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('payments.candidateLabel')}</span> {candidateName}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('payments.amountLabel')}</span> €
            {payment.amount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('payments.dateLabel')}</span>{" "}
            {formatDate(payment.date, language === 'sq' ? 'sq-AL' : language === 'en' ? 'en-US' : 'sr-RS')}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('payments.methodLabel')}</span>{" "}
            {payment.method === "bank" ? t('payments.bankTransfer') : t('payments.cashInHand')}
          </p>
        </div>
      </div>
    </Modal>
  );
}
