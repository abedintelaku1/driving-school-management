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
  PlusIcon,
  TrashIcon,
  DownloadIcon,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Tabs, TabList, Tab, TabPanel } from "../../components/ui/Tabs";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { api } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "../../hooks/useToast";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { useLanguage } from "../../hooks/useLanguage";
import type { Appointment } from "../../types";

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
  documents?: any[];
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
      // Silently handle errors
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
            documents={candidate?.documents || []}
            onRefresh={loadData}
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
        <span>{value ? new Date(value as string).toLocaleDateString("sq-AL") : "—"}</span>
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
          | { firstName?: string; lastName?: string }
          | null
          | undefined;
        if (!user || typeof user !== "object")
          return <span className="text-gray-400">—</span>;
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
        return (
          <span className="text-gray-700">{name || "—"}</span>
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

function DocumentsTab({
  candidateId,
  documents: documentsProp,
  onRefresh,
}: {
  candidateId: string;
  documents: any[];
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 0;
  const isStaff = user?.role === 2;
  const canAdd = isAdmin || isStaff;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const documents = Array.isArray(documentsProp) ? documentsProp : [];

  const docColumns = [
    { key: "name", label: "Emër" },
    {
      key: "type",
      label: "Tip",
      render: (v: unknown) => (v ? <Badge variant="info">{String(v)}</Badge> : <span className="text-gray-400">—</span>),
    },
    {
      key: "uploadedAt",
      label: "Datë ngarkimi",
      render: (v: unknown) =>
        v ? (
          <span>{new Date(v as string).toLocaleDateString("sq-AL")}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "uploadedBy",
      label: "Ngarkuar nga",
      render: (value: unknown) => {
        const user = value as { firstName?: string; lastName?: string; email?: string } | null | undefined;
        if (!user || typeof user !== "object") return <span className="text-gray-400">—</span>;
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
        return (
          <span className="text-gray-700" title={name || user.email || ""}>
            {name || user.email || "—"}
          </span>
        );
      },
    },
  ];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast("error", "Zgjidhni një skedar");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (uploadName.trim()) formData.append("name", uploadName.trim());
      const { ok, data } = await api.uploadCandidateDocument(candidateId, formData);
      if (ok) {
        toast("success", "Dokumenti u shtua");
        setShowAddModal(false);
        setUploadFile(null);
        setUploadName("");
        onRefresh();
      } else {
        toast("error", (data as any)?.message || "Dështoi shtimi i dokumentit");
      }
    } catch {
      toast("error", "Dështoi shtimi i dokumentit");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setLoading(true);
    try {
      const docId = selectedDoc._id || selectedDoc.id;
      const { ok, data } = await api.updateCandidateDocument(candidateId, docId, {
        name: editName.trim(),
        notes: editNotes,
      });
      if (ok) {
        toast("success", "Dokumenti u përditësua");
        setShowEditModal(false);
        setSelectedDoc(null);
        onRefresh();
      } else {
        toast("error", (data as any)?.message || "Dështoi përditësimi");
      }
    } catch {
      toast("error", "Dështoi përditësimi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    try {
      const docId = selectedDoc._id || selectedDoc.id;
      const { ok, data } = await api.deleteCandidateDocument(candidateId, docId);
      if (ok) {
        toast("success", "Dokumenti u fshi");
        setShowDeleteModal(false);
        setSelectedDoc(null);
        onRefresh();
      } else {
        toast("error", (data as any)?.message || "Dështoi fshirja");
      }
    } catch {
      toast("error", "Dështoi fshirja");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc: any) => {
    const docId = doc._id || doc.id;
    const name = doc.name || "document";
    api.downloadCandidateDocument(candidateId, docId, name);
  };

  return (
    <div className="space-y-6">
      <Card padding="none">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Dokumentet e kandidatit</h3>
          {canAdd && (
            <Button
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Shto dokument
            </Button>
          )}
        </div>
        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nuk ka dokumente të ngarkuara.</p>
            {canAdd && (
              <Button
                className="mt-3"
                variant="outline"
                icon={<PlusIcon className="w-4 h-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Shto dokumentin e parë
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            data={documents}
            columns={docColumns}
            keyExtractor={(d) => d._id || d.id || String(documents.indexOf(d))}
            searchable={false}
            emptyMessage="Nuk ka dokumente"
            actions={
              canEdit || canDelete || documents.some((d) => d.filePath)
                ? (doc) => (
                    <div className="flex items-center gap-2">
                      {doc.filePath && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<DownloadIcon className="w-4 h-4" />}
                          onClick={() => handleDownload(doc)}
                        >
                          Shkarko
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<EditIcon className="w-4 h-4" />}
                          onClick={() => {
                            setSelectedDoc(doc);
                            setEditName(doc.name || "");
                            setEditNotes(doc.notes || "");
                            setShowEditModal(true);
                          }}
                        >
                          Ndrysho
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<TrashIcon className="w-4 h-4" />}
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowDeleteModal(true);
                          }}
                        >
                          Fshi
                        </Button>
                      )}
                    </div>
                  )
                : undefined
            }
          />
        )}
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setUploadFile(null);
          setUploadName("");
        }}
        title="Shto dokument"
        description="Zgjidhni një skedar (PDF, JPG, PNG, DOCX)."
      >
        <form onSubmit={handleAdd}>
          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx,application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <Input
              label="Emër (opsional)"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Emri i dokumentit"
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Anulo
            </Button>
            <Button type="submit" disabled={loading || !uploadFile}>
              {loading ? "Duke ngarkuar..." : "Ngarko"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDoc(null);
        }}
        title="Ndrysho dokumentin"
        description="Përditësoni emrin ose shënimet."
      >
        <form onSubmit={handleEdit}>
          <div className="space-y-4">
            <Input
              label="Emër"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <Input
              label="Shënime"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Opsionale"
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
              Anulo
            </Button>
            <Button type="submit" disabled={loading}>{loading ? "Duke ruajtur..." : "Ruaj"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDoc(null);
        }}
        title="Fshi dokumentin"
        description="Jeni të sigurt që dëshironi të fshini këtë dokument? Ky veprim nuk mund të kthehet."
      >
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Anulo
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? "Duke fshirë..." : "Fshi"}
          </Button>
        </div>
      </Modal>
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

