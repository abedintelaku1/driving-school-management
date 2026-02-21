import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CreditCardIcon,
  ClockIcon,
  UserIcon,
  PackageIcon,
  FileTextIcon,
  UploadIcon,
  DownloadIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Tabs, TabList, Tab, TabPanel } from "../../components/ui/Tabs";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { api } from "../../utils/api";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { toast } from "../../hooks/useToast";
import type { Appointment, Document } from "../../types";

type Candidate = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  status?: string;
  uniqueClientNumber?: string;
  instructor?: any;
  instructorId?: string;
  carId?: string;
  packageId?: string;
  personalNumber?: string;
};

type AppointmentEx = Appointment & {
  _id?: string;
  candidate?: any;
  instructor?: any;
  candidateId?: string;
  instructorId?: string;
};

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const defaultTab = searchParams.get("tab") || "appointments";
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [appointments, setAppointments] = useState<AppointmentEx[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [instructors, setInstructors] = useState<
    { id: string; name: string }[]
  >([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [candRes, instRes, paymentsRes] = await Promise.all([
        api.getCandidate(id),
        api.listInstructors(),
        api.getPaymentsByCandidate(id),
      ]);

      if (candRes.ok && candRes.data) {
        const data = candRes.data as any;
        // Format dateOfBirth if it's a Date object
        let dateOfBirth = data.dateOfBirth;
        if (dateOfBirth instanceof Date) {
          dateOfBirth = dateOfBirth.toISOString().split("T")[0];
        } else if (
          typeof dateOfBirth === "string" &&
          dateOfBirth.includes("T")
        ) {
          dateOfBirth = dateOfBirth.split("T")[0];
        }

        setCandidate({
          ...data,
          id: data._id || data.id,
          dateOfBirth: dateOfBirth || data.dateOfBirth,
          instructorId:
            data.instructorId?._id ||
            data.instructorId ||
            data.instructor?._id ||
            data.instructor ||
            "",
        } as Candidate);

        // Fetch package if candidate has one
        if (data.packageId) {
          const packageRes = await api.getPackage(data.packageId);
          if (packageRes.ok && packageRes.data) {
            setPackageInfo(packageRes.data);
          }
        }
      }

      if (instRes?.ok && instRes.data) {
        const mapped = (instRes.data as any[]).map((inst) => ({
          id: inst._id || inst.id,
          name: `${inst.user?.firstName || ""} ${inst.user?.lastName || ""}`.trim(),
        }));
        setInstructors(mapped);
      }

      if (paymentsRes?.ok && paymentsRes.data) {
        const mapped = (paymentsRes.data as any[]).map((item) => ({
          id: item._id || item.id,
          amount: item.amount || 0,
          method: item.method || "cash",
          date: item.date
            ? new Date(item.date).toISOString().split("T")[0]
            : "",
          notes: item.notes || "",
          addedBy: item.addedBy || null,
        }));
        setPayments(mapped);
      }
    } catch (err) {
      console.error("Failed to load candidate detail", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedHours = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + (a.hours || 0), 0),
    [appointments],
  );

  const instructorName = useMemo(() => {
    if (candidate?.instructor?.user) {
      return `${candidate.instructor.user.firstName || ""} ${candidate.instructor.user.lastName || ""}`.trim();
    }
    const aptWithInstructor = appointments.find((a) => a.instructor?.user);
    if (aptWithInstructor?.instructor?.user) {
      return `${aptWithInstructor.instructor.user.firstName || ""} ${aptWithInstructor.instructor.user.lastName || ""}`.trim();
    }
    return t('common.notAssigned');
  }, [candidate?.instructor, appointments]);

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const packagePrice = packageInfo?.price || 0;
  const balance = packagePrice - totalPaid;
  const balanceText = packageInfo
    ? `€${Math.abs(balance).toLocaleString()}`
    : "€0";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500">{t('common.loadingProfile')}</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <EmptyState
          title={t('candidates.candidateNotFound')}
          description={t('candidates.candidateNotFoundDescription')}
          action={{
            label: t('candidates.backToCandidates'),
            onClick: () => navigate("/admin/candidates"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/candidates")}
          icon={<ArrowLeftIcon className="w-4 h-4" />}
        >
          {t('common.back')}
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <Avatar
            name={`${candidate.firstName} ${candidate.lastName}`}
            size="xl"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                {candidate.uniqueClientNumber && (
                  <p className="text-gray-500">
                    {candidate.uniqueClientNumber}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={
                    (candidate.status as "active" | "inactive") || "active"
                  }
                />
                {user?.role === 0 && (
                  <Button
                    variant="outline"
                    icon={<EditIcon className="w-4 h-4" />}
                    onClick={() => setEditOpen(true)}
                  >
                    {t('common.edit')}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3 text-gray-600">
                <MailIcon className="w-5 h-5 text-gray-400" />
                <span>{candidate.email || "-"}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <span>{candidate.phone || "-"}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <span>{t('candidates.dateOfBirth')}: {candidate.dateOfBirth || "-"}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 md:col-span-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span>{candidate.address || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <PackageIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('candidates.package')}</p>
              <p className="font-semibold text-gray-900">
                {packageInfo ? packageInfo.name : t('candidates.notAssignedPackage')}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <UserIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('candidates.instructor')}</p>
              <p className="font-semibold text-gray-900">{instructorName}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('candidates.completedHours')}</p>
              <p className="font-semibold text-gray-900">{completedHours}h</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <CreditCardIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('candidates.balance')}</p>
              <p className="font-semibold text-gray-900">{balanceText}</p>
              {packageInfo && balance > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {((totalPaid / packagePrice) * 100).toFixed(1)}% {t('candidates.paid')}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultTab={defaultTab}>
        <TabList>
          <Tab value="appointments">{t('candidates.appointments')}</Tab>
          <Tab value="payments">{t('candidates.payments')}</Tab>
          <Tab value="documents">{t('candidates.documents')}</Tab>
          <Tab value="package">{t('candidates.packages')}</Tab>
        </TabList>

        <TabPanel value="appointments">
          <AppointmentsTab appointments={appointments} />
        </TabPanel>

        <TabPanel value="payments">
          <PaymentsTab
            candidateId={candidate.id || candidate._id || ""}
            payments={payments}
            packageInfo={packageInfo}
            onPaymentAdded={loadData}
          />
        </TabPanel>

        <TabPanel value="documents">
          <DocumentsTab
            candidateId={candidate.id || candidate._id || ""}
            documents={documents}
            documentsLoading={documentsLoading}
            onDocumentsChange={setDocuments}
            onDocumentsLoadingChange={setDocumentsLoading}
            userRole={user?.role}
          />
        </TabPanel>

        <TabPanel value="package">
          <PackageTab />
        </TabPanel>
      </Tabs>

      {candidate && (
        <EditCandidateModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          candidate={candidate}
          instructors={instructors}
          onSaved={loadData}
        />
      )}
    </div>
  );
}

function AppointmentsTab({ appointments }: { appointments: AppointmentEx[] }) {
  const { t } = useLanguage();
  const columns = [
    {
      key: "date",
      label: t('appointments.date'),
      sortable: true,
    },
    {
      key: "time",
      label: t('appointments.time'),
      render: (_: unknown, appointment: AppointmentEx) => (
        <span>
          {appointment.startTime} - {appointment.endTime}
        </span>
      ),
    },
    {
      key: "hours",
      label: t('appointments.hours'),
    },
    {
      key: "status",
      label: t('common.status'),
      render: (value: unknown) => {
        const status = value as string;
        const variants: Record<string, "success" | "warning" | "danger"> = {
          completed: "success",
          scheduled: "warning",
          cancelled: "danger",
        };
        const statusLabels: Record<string, string> = {
          completed: t('appointments.completed'),
          scheduled: t('appointments.scheduled'),
          cancelled: t('appointments.cancelled'),
        };
        return (
          <Badge variant={variants[status] || "outline"} dot>
            {statusLabels[status] || (status?.charAt(0).toUpperCase() + status?.slice(1))}
          </Badge>
        );
      },
    },
    {
      key: "notes",
      label: t('appointments.notes'),
      render: (value: unknown) => (
        <span className="text-gray-500">{(value as string) || "-"}</span>
      ),
    },
  ];
  return (
    <Card padding="none">
      <DataTable
        data={appointments}
        columns={columns}
        keyExtractor={(a) => a._id || a.id || ""}
        searchable={false}
        emptyMessage={t('candidates.noAppointmentsScheduled')}
      />
    </Card>
  );
}

type EditModalProps = {
  open: boolean;
  onClose: () => void;
  candidate: Candidate;
  instructors: { id: string; name: string }[];
  onSaved: () => void;
};

function EditCandidateModal({
  open,
  onClose,
  candidate,
  instructors,
  onSaved,
}: EditModalProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    firstName: candidate.firstName || "",
    lastName: candidate.lastName || "",
    email: candidate.email || "",
    phone: candidate.phone || "",
    dateOfBirth: candidate.dateOfBirth || "",
    personalNumber: candidate.personalNumber || "",
    address: candidate.address || "",
    instructorId:
      candidate.instructorId ||
      candidate.instructor?._id ||
      candidate.instructor?.id ||
      "",
    status: (candidate.status as "active" | "inactive") || "active",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      firstName: candidate.firstName || "",
      lastName: candidate.lastName || "",
      email: candidate.email || "",
      phone: candidate.phone || "",
      dateOfBirth: candidate.dateOfBirth || "",
      personalNumber: candidate.personalNumber || "",
      address: candidate.address || "",
      instructorId:
        candidate.instructorId ||
        candidate.instructor?._id ||
        candidate.instructor?.id ||
        "",
      status: (candidate.status as "active" | "inactive") || "active",
    });
  }, [candidate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      // Convert empty string to null for instructorId
      if (payload.instructorId === "") {
        payload.instructorId = null;
      }
      const resp = await api.updateCandidate(
        candidate._id || candidate.id!,
        payload as any,
      );
      if (!resp.ok) {
        alert(
          (resp.data as any)?.message || t('documents.failedToUpdateCandidate'),
        );
        return;
      }
      onSaved();
      onClose();
    } catch (err) {
      alert(t('documents.failedToUpdateCandidate'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t('candidates.editCandidate')}
      description={t('candidates.updateCandidateDetails')}
      size="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            fullWidth
            className="sm:w-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            loading={saving}
            fullWidth
            className="sm:w-auto"
          >
            {t('common.saveChanges')}
          </Button>
        </div>
      }
    >
      <form
        className="space-y-4 sm:space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('common.firstName')}
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            label={t('common.lastName')}
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('common.email')}
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label={t('common.phone')}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('candidates.dateOfBirth')}
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
          />
          <Input
            label={t('candidates.personalNumber')}
            value={form.personalNumber || ""}
            onChange={(e) =>
              setForm({ ...form, personalNumber: e.target.value })
            }
          />
        </div>
        <Input
          label={t('common.address')}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t('candidates.instructor')}
            value={form.instructorId}
            onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
            options={[
              { value: "", label: t('common.notAssigned') },
              ...instructors.map((i) => ({
                value: i.id,
                label: i.name || t('common.instructor'),
              })),
            ]}
          />
          <Select
            label={t('common.status')}
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as "active" | "inactive",
              })
            }
            options={[
              { value: "active", label: t('common.active') },
              { value: "inactive", label: t('common.inactive') },
            ]}
          />
        </div>
      </form>
    </Modal>
  );
}

function PaymentsTab({
  candidateId,
  payments: paymentsProp,
  packageInfo: packageInfoProp,
  onPaymentAdded,
}: {
  candidateId: string;
  payments: any[];
  packageInfo: any;
  onPaymentAdded: () => void;
}) {
  const { t } = useLanguage();
  const totalPaid = useMemo(() => {
    return paymentsProp.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [paymentsProp]);

  const packagePrice = packageInfoProp?.price || 0;
  const balance = packagePrice - totalPaid;
  const isFullyPaid = balance <= 0;

  const paymentColumns = [
    {
      key: "date",
      label: t('payments.date'),
      sortable: true,
      render: (value: unknown) => (
        <span>{new Date(value as string).toLocaleDateString()}</span>
      ),
    },
    {
      key: "amount",
      label: t('payments.amount'),
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">
          €{(value as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: "method",
      label: t('payments.method'),
      render: (value: unknown) => {
        const method = value as string;
        const methodLabels: Record<string, string> = {
          bank: t('payments.bankTransfer'),
          cash: t('payments.cashInHand'),
        };
        return (
          <Badge variant={method === "bank" ? "info" : "default"}>
            {methodLabels[method] || (method.charAt(0).toUpperCase() + method.slice(1))}
          </Badge>
        );
      },
    },
    {
      key: "addedBy",
      label: t('candidates.addedBy'),
      render: (value: unknown) => {
        const user = value as
          | { firstName?: string; lastName?: string; email?: string }
          | null
          | undefined;
        if (!user || typeof user !== "object")
          return <span className="text-gray-400">—</span>;
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
        return (
          <span className="text-gray-700">{name || user.email || "—"}</span>
        );
      },
    },
    {
      key: "notes",
      label: t('payments.notes'),
      render: (value: unknown) => (
        <span className="text-gray-500 truncate max-w-[200px] block">
          {(value as string) || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Package Price */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="p-4">
            <p className="text-blue-100 text-sm">{t('payments.packagePrice')}</p>
            <p className="text-3xl font-bold mt-1">
              {packageInfoProp
                ? `€${packagePrice.toLocaleString()}`
                : t('candidates.notAssignedPackage')}
            </p>
            {packageInfoProp && (
              <p className="text-blue-100 text-xs mt-1">
                {packageInfoProp.name}
              </p>
            )}
          </div>
        </Card>

        {/* Total Paid */}
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="p-4">
            <p className="text-green-100 text-sm">{t('payments.totalPaid')}</p>
            <p className="text-3xl font-bold mt-1">
              €{totalPaid.toLocaleString()}
            </p>
            <p className="text-green-100 text-xs mt-1">
              {paymentsProp.length} {t('payments.transactions')}
            </p>
          </div>
        </Card>

        {/* Balance (Remaining) */}
        <Card
          className={`bg-gradient-to-r text-white ${
            isFullyPaid
              ? "from-green-500 to-green-600"
              : balance > 0
                ? "from-orange-600 to-orange-700"
                : "from-red-600 to-red-700"
          }`}
        >
          <div className="p-4">
            <p className="text-white/90 text-sm">
              {isFullyPaid
                ? t('payments.fullyPaid')
                : balance > 0
                  ? t('payments.remaining')
                  : t('payments.overpaid')}
            </p>
            <p className="text-3xl font-bold mt-1">
              €{Math.abs(balance).toLocaleString()}
            </p>
            {!isFullyPaid && balance > 0 && (
              <p className="text-white/90 text-xs mt-1">
                {((totalPaid / packagePrice) * 100).toFixed(1)}% {t('candidates.paid')}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      <Card padding="none">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('payments.paymentHistory')}
          </h3>
        </div>
        {paymentsProp.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>{t('payments.noPaymentsYet')}</p>
          </div>
        ) : (
          <DataTable
            data={paymentsProp}
            columns={paymentColumns}
            keyExtractor={(payment) => payment.id}
            searchable={false}
            emptyMessage={t('payments.noPaymentsFound')}
          />
        )}
      </Card>
    </div>
  );
}

function PackageTab() {
  const { t } = useLanguage();
  return (
    <Card>
      <div className="p-4 sm:p-6 text-gray-600">{t('candidates.noPackageAssigned')}</div>
    </Card>
  );
}

type DocumentsTabProps = {
  candidateId: string;
  documents: Document[];
  documentsLoading: boolean;
  onDocumentsChange: (documents: Document[]) => void;
  onDocumentsLoadingChange: (loading: boolean) => void;
  userRole?: number;
};

function DocumentsTab({
  candidateId,
  documents,
  documentsLoading,
  onDocumentsChange,
  onDocumentsLoadingChange,
  userRole,
}: DocumentsTabProps) {
  const { t } = useLanguage();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editDocumentName, setEditDocumentName] = useState("");
  const [updating, setUpdating] = useState(false);

  const isAdmin = userRole === 0;
  const canView = userRole === 0 || userRole === 2; // Admin or Staff can view documents
  const canUpload = userRole === 0 || userRole === 2; // Admin or Staff can upload documents
  const canDelete = isAdmin; // Only admin can delete
  const canEdit = isAdmin; // Only admin can edit

  const loadDocuments = useCallback(async () => {
    if (!candidateId || !canView) return; // Admin and Staff can view documents
    onDocumentsLoadingChange(true);
    try {
      const res = await api.listDocuments(candidateId);
      if (res.ok && res.data) {
        onDocumentsChange(res.data);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      onDocumentsLoadingChange(false);
    }
  }, [candidateId, canView, onDocumentsChange, onDocumentsLoadingChange]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const ext = file.name.split(".").pop()?.toUpperCase();
      if (!["PDF", "JPG", "JPEG", "PNG", "DOCX"].includes(ext || "")) {
        alert(t('documents.fileTypeNotAllowed'));
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(t('documents.fileTooLarge'));
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !candidateId) return;

    setUploading(true);
    try {
      const res = await api.uploadDocument(
        candidateId,
        selectedFile,
        documentName || undefined
      );
      if (res.ok) {
        setUploadOpen(false);
        setSelectedFile(null);
        setDocumentName("");
        // Reload documents
        loadDocuments();
      } else {
        const errorMessage = (res.data as any)?.message || t('documents.failedToUpload');
        console.error("Upload failed:", res.status, errorMessage, res.data);
        alert(errorMessage);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(t('documents.failedToUpload'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm(t('documents.confirmDelete'))) {
      return;
    }

    setDeletingId(documentId);
    try {
      const res = await api.deleteDocument(candidateId, documentId);
      if (res.ok) {
        loadDocuments();
      } else {
        alert(
          (res.data as any)?.message || t('documents.failedToDelete')
        );
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(t('documents.failedToDelete'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setEditDocumentName(doc.name);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingDocument || !editDocumentName.trim()) {
      alert(t('documents.documentNameRequired'));
      return;
    }

    const docId = editingDocument._id || editingDocument.id || "";
    if (!docId) {
      alert(t('documents.invalidDocumentId'));
      return;
    }

    setUpdating(true);
    try {
      const res = await api.updateDocument(candidateId, docId, editDocumentName.trim());
      if (res.ok) {
        setEditOpen(false);
        setEditingDocument(null);
        setEditDocumentName("");
        loadDocuments();
      } else {
        const errorMessage = (res.data as any)?.message || t('documents.failedToUpdateDocumentMessage');
        console.error("Update failed:", res.status, errorMessage, res.data);
        alert(errorMessage);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert(t('documents.failedToUpdateDocument'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      await api.downloadDocument(candidateId, documentId);
    } catch (err) {
      console.error("Download error:", err);
      const errorMessage = err instanceof Error ? err.message : t('documents.downloadError');
      toast('error', errorMessage);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
      const locale = localeMap[language] || 'sq-AL';
      const formattedDate = date.toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = date.toLocaleTimeString("sq-AL", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${formattedDate} në ${formattedTime}`;
    } catch {
      return dateString;
    }
  };

  const getUploadedByName = (uploadedBy: Document["uploadedBy"]) => {
    if (typeof uploadedBy === "object" && uploadedBy !== null) {
      const name = [uploadedBy.firstName, uploadedBy.lastName]
        .filter(Boolean)
        .join(" ");
      return name || uploadedBy.email || t('common.unknown');
    }
    return t('common.unknown');
  };

  const getUploaderRole = (uploadedBy: Document["uploadedBy"]) => {
    if (typeof uploadedBy === "object" && uploadedBy !== null && uploadedBy.role !== undefined) {
      if (uploadedBy.role === 0) return t('common.roleAdmin');
      if (uploadedBy.role === 2) return t('common.roleStaff');
      if (uploadedBy.role === 1) return t('common.roleInstructor');
    }
    return null;
  };

  const getUploaderRoleNumber = (uploadedBy: Document["uploadedBy"]): number | null => {
    if (typeof uploadedBy === "object" && uploadedBy !== null && uploadedBy.role !== undefined) {
      return uploadedBy.role as number;
    }
    return null;
  };

  const documentColumns = [
    {
      key: "name",
      label: t('documents.documentName'),
      sortable: true,
    },
    {
      key: "type",
      label: t('documents.documentType'),
      render: (value: unknown) => (
        <Badge variant="outline">{value as string}</Badge>
      ),
    },
    {
      key: "uploadDate",
      label: t('documents.uploadDate') + '/' + t('documents.modifiedDate'),
      sortable: true,
      render: (_: unknown, doc: Document) => {
        const dateToShow = doc.updatedDate || doc.uploadDate;
        const isModified = !!doc.updatedDate;
        return (
          <div className="flex flex-col">
            <span className="text-gray-600">{formatDate(dateToShow as string)}</span>
            <span className="text-xs text-gray-400 mt-1">
              {isModified ? `(${t('documents.modified')})` : `(${t('documents.uploaded')})`}
            </span>
          </div>
        );
      },
    },
    {
      key: "uploadedBy",
      label: t('documents.uploadedBy'),
      render: (value: unknown) => {
        const uploadedBy = value as Document["uploadedBy"];
        const name = getUploadedByName(uploadedBy);
        const role = getUploaderRole(uploadedBy);
        const roleNumber = getUploaderRoleNumber(uploadedBy);
        return (
          <div className="flex items-center gap-2">
            <span className="text-gray-700">{name}</span>
            {role && (
              <Badge 
                variant={roleNumber === 0 ? "info" : roleNumber === 2 ? "warning" : "outline"}
                className="text-xs"
              >
                {role}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "fileSize",
      label: t('documents.fileSize'),
      render: (value: unknown) => (
        <span className="text-gray-500">{formatFileSize(value as number)}</span>
      ),
    },
    {
      key: "actions",
      label: t('common.actions'),
      render: (_: unknown, doc: Document) => {
        const docId = doc._id || doc.id || "";
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<DownloadIcon className="w-4 h-4" />}
              onClick={() => handleDownload(docId)}
              title={t('documents.download')}
            >
              {t('documents.download')}
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                icon={<EditIcon className="w-4 h-4" />}
                onClick={() => handleEdit(doc)}
                title={t('common.edit')}
                className="text-blue-600 hover:text-blue-700"
              >
                {t('common.edit')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                icon={<TrashIcon className="w-4 h-4" />}
                onClick={() => handleDelete(docId)}
                disabled={deletingId === docId}
                title={t('common.delete')}
                className="text-red-600 hover:text-red-700"
              >
                {t('common.delete')}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('documents.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? t('documents.allCandidateDocuments')
              : t('documents.instructorDocumentsNote')}
          </p>
        </div>
        {canUpload && (
          <Button
            icon={<UploadIcon className="w-4 h-4" />}
            onClick={() => setUploadOpen(true)}
          >
            {t('documents.uploadDocument')}
          </Button>
        )}
      </div>

      {/* Documents Table */}
      {documentsLoading ? (
        <Card>
          <div className="p-8 text-center text-gray-500">
            {t('documents.loadingDocuments')}
          </div>
        </Card>
      ) : documents.length === 0 ? (
        <Card>
          <EmptyState
            title={t('documents.noDocuments')}
            description={
              canUpload
                ? t('documents.noDocumentsDescription')
                : t('documents.noDocumentsForCandidate')
            }
          />
        </Card>
      ) : (
        <Card padding="none">
          <DataTable
            data={documents}
            columns={documentColumns}
            keyExtractor={(doc) => doc._id || doc.id || ""}
            searchable={false}
            emptyMessage={t('documents.noDocuments')}
          />
        </Card>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setSelectedFile(null);
          setDocumentName("");
        }}
        title={t('documents.uploadDocument')}
        description={t('documents.uploadDocumentDescription')}
        size="lg"
        footer={
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setUploadOpen(false);
                setSelectedFile(null);
                setDocumentName("");
              }}
              disabled={uploading}
              fullWidth
              className="sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              loading={uploading}
              disabled={!selectedFile}
              fullWidth
              className="sm:w-auto"
              icon={<UploadIcon className="w-4 h-4" />}
            >
              {t('documents.upload')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('documents.file')}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {selectedFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <FileTextIcon className="w-4 h-4" />
                <span>{selectedFile.name}</span>
                <span className="text-gray-400">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </div>
            )}
          </div>
          <Input
            label={t('documents.documentNameOptional')}
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder={selectedFile?.name.replace(/\.[^/.]+$/, "") || t('documents.documentNamePlaceholder')}
          />
          </div>
        </Modal>

        {/* Edit Document Modal */}
        <Modal
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            setEditingDocument(null);
            setEditDocumentName("");
          }}
          title={t('documents.editDocumentName')}
          description={t('documents.editDocumentDescription')}
          size="lg"
          footer={
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditOpen(false);
                  setEditingDocument(null);
                  setEditDocumentName("");
                }}
                disabled={updating}
                fullWidth
                className="sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleUpdate}
                loading={updating}
                disabled={!editDocumentName.trim()}
                fullWidth
                className="sm:w-auto"
                icon={<EditIcon className="w-4 h-4" />}
              >
                {t('common.saveChanges')}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label={t('documents.documentName')}
              required
              value={editDocumentName}
              onChange={(e) => setEditDocumentName(e.target.value)}
              placeholder={t('documents.documentNamePlaceholder')}
            />
            {editingDocument && (
              <div className="text-sm text-gray-500">
                <p><strong>{t('documents.documentType')}:</strong> {editingDocument.type}</p>
                <p><strong>{t('documents.fileSize')}:</strong> {formatFileSize(editingDocument.fileSize)}</p>
                <p><strong>{t('documents.uploaded')}:</strong> {formatDate(editingDocument.uploadDate)}</p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  }
