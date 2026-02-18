import React, { useEffect, useMemo, useState, useRef } from "react";
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Checkbox } from "../../components/ui/Checkbox";
import { FilterBar } from "../../components/ui/FilterBar";
import { toast } from "../../hooks/useToast";
import { api } from "../../utils/api/index";
import type { Car } from "../../types";

type InstructorRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  personalNumber?: string;
  address?: string;
  status: "active" | "inactive";
  categories: string[];
  totalHours?: number;
  assignedCarIds: string[];
  personalCarIds?: string[];
  instructorType?: 'insider' | 'outsider';
  ratePerHour?: number;
  debtPerHour?: number;
  totalCredits?: number;
  totalDebt?: number;
};
export function InstructorsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInstructor, setEditingInstructor] =
    useState<InstructorRow | null>(null);
  const [instructorToDelete, setInstructorToDelete] =
    useState<InstructorRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [rows, setRows] = useState<InstructorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [licenseCategories, setLicenseCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchInstructors = async () => {
      setLoading(true);
      try {
        const result = await api.listInstructors();
        if (!result.ok || !result.data) {
          const errorMsg =
            typeof result.data === "object" &&
            result.data !== null &&
            "message" in result.data
              ? (result.data as any).message
              : "Failed to load instructors";
          throw new Error(errorMsg);
        }
        const mapped: InstructorRow[] = (result.data || []).map((item: any) => {
          // Format dateOfBirth if it exists
          let dateOfBirth = "";
          if (item.dateOfBirth) {
            const date = new Date(item.dateOfBirth);
            dateOfBirth = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
          }

          return {
            id: item._id || item.id,
            firstName: item.user?.firstName || "",
            lastName: item.user?.lastName || "",
            email: item.user?.email || "",
            phone: item.phone || "",
            dateOfBirth: dateOfBirth,
            personalNumber: item.personalNumber || "",
            address: item.address || "",
            status: item.status || "active",
            categories: item.specialties || [],
            totalHours: item.totalHours || 0,
            assignedCarIds: (item.assignedCarIds || []).map((id: any) => {
              // Handle both ObjectId objects and string IDs
              if (typeof id === "object" && id !== null && id._id) {
                return id._id.toString();
              }
              return id?.toString() || id;
            }),
            personalCarIds: (item.personalCarIds || []).map((id: any) => {
              // Handle both ObjectId objects and string IDs
              if (typeof id === "object" && id !== null && id._id) {
                return id._id.toString();
              }
              return id?.toString() || id;
            }),
            instructorType: item.instructorType || 'insider',
            ratePerHour: item.ratePerHour || 0,
            debtPerHour: item.debtPerHour || 0,
            totalCredits: item.totalCredits || 0,
            totalDebt: item.totalDebt || 0,
          };
        });
        setRows(mapped);
      } catch (err) {
        console.error("Failed to fetch instructors", err);
        toast("error", "Failed to load instructors");
      } finally {
        setLoading(false);
      }
    };
    fetchInstructors();
  }, [refreshKey]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const { ok, data } = await api.listCars();
        if (ok && data) {
          const mapped = (data as any[]).map((item) => ({
            id: item._id || item.id,
            model: item.model || '',
            yearOfManufacture: item.yearOfManufacture || 0,
            chassisNumber: item.chassisNumber || '',
            transmission: item.transmission || 'manual',
            fuelType: item.fuelType || 'petrol',
            licensePlate: item.licensePlate || '',
            ownership: item.ownership || 'owned',
            registrationExpiry: item.registrationExpiry
              ? new Date(item.registrationExpiry).toISOString().split('T')[0]
              : '',
            lastInspection: item.lastInspection
              ? new Date(item.lastInspection).toISOString().split('T')[0]
              : '',
            nextInspection: item.nextInspection
              ? new Date(item.nextInspection).toISOString().split('T')[0]
              : '',
            totalHours: item.totalHours || 0,
            status: item.status || 'active',
            instructorId: item.instructorId || null,
            createdAt: item.createdAt
              ? new Date(item.createdAt).toISOString().split('T')[0]
              : '',
            updatedAt: item.updatedAt
              ? new Date(item.updatedAt).toISOString().split('T')[0]
              : '',
          }));
          setCars(mapped as Car[]);
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
      }
    };
    fetchCars();
  }, []);

  useEffect(() => {
    const fetchLicenseCategories = async () => {
      try {
        const { ok, data } = await api.getLicenseCategories();
        if (ok && data) {
          setLicenseCategories(data);
        }
      } catch (error) {
        console.error('Error fetching license categories:', error);
        // Fallback to default categories if API fails
        setLicenseCategories(['AM', 'A1', 'A2', 'A', 'B1', 'B', 'C1', 'C', 'D1', 'D', 'BE', 'CE', 'DE']);
      }
    };
    fetchLicenseCategories();
  }, []);

  const filteredInstructors = useMemo(() => {
    return rows.filter((instructor) => {
      if (statusFilter && instructor.status !== statusFilter) return false;
      if (categoryFilter && !instructor.categories.includes(categoryFilter))
        return false;
      return true;
    });
  }, [statusFilter, categoryFilter, rows]);

  const clearFilters = () => {
    setStatusFilter("");
    setCategoryFilter("");
  };

  const hasActiveFilters = !!(statusFilter || categoryFilter);
  const columns = [
    {
      key: "name",
      label: "Instructor",
      sortable: true,
      render: (_: unknown, instructor: InstructorRow) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={`${instructor.firstName} ${instructor.lastName}`}
            size="sm"
          />
          <div>
            <p className="font-medium text-gray-900">
              {instructor.firstName} {instructor.lastName}
            </p>
            <p className="text-sm text-gray-500">{instructor.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
    },
    {
      key: "categories",
      label: "Categories",
      render: (value: unknown) => (
        <div className="flex flex-wrap gap-1">
          {(value as string[]).map((cat) => (
            <Badge key={cat} variant="info" size="sm">
              {cat}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "totalHours",
      label: "Total Hours",
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">{value as number}h</span>
      ),
    },
    {
      key: "assignedCarIds",
      label: "Cars",
      width: "200px",
      render: (value: unknown, instructor: InstructorRow) => {
        const assignedCarIds = value as string[];
        const personalCarIds = instructor.personalCarIds || [];
        const allCarIds = [...assignedCarIds, ...personalCarIds];
        
        const assignedCars = assignedCarIds
          .map((id) => cars.find((c) => c.id === id))
          .filter(Boolean);
        const personalCars = personalCarIds
          .map((id) => cars.find((c) => c.id === id))
          .filter(Boolean);
        
        if (allCarIds.length === 0) {
          return <span className="text-gray-400">None</span>;
        }
        
        return (
          <div className="flex flex-col gap-1">
            {personalCars.map((car) => (
              <Badge key={car!.id} variant="info" size="sm" className="w-fit whitespace-nowrap">
                {car!.licensePlate} (Personal)
              </Badge>
            ))}
            {assignedCars.map((car) => (
              <Badge key={car!.id} variant="outline" size="sm" className="w-fit whitespace-nowrap">
                {car!.licensePlate}
              </Badge>
            ))}
          </div>
        );
      },
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
      key: "balance",
      label: "Kredite",
      sortable: true,
      width: "100px",
      render: (_: unknown, instructor: InstructorRow) => {
        if (instructor.instructorType !== 'outsider') {
          return <span className="text-gray-400">-</span>;
        }
        const balance = instructor.totalCredits || 0;
        return (
          <span className="font-semibold text-green-600 whitespace-nowrap">
            €{balance.toFixed(2)}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: unknown) => (
        <StatusBadge status={value as "active" | "inactive"} />
      ),
    },
  ];
  const handleDeleteClick = (instructor: InstructorRow) => {
    setInstructorToDelete(instructor);
  };

  const handleDeleteConfirm = async () => {
    if (!instructorToDelete) return;

    setIsDeleting(true);
    try {
      const result = await api.deleteInstructor(instructorToDelete.id);

      if (!result.ok) {
        toast("error", result.data?.message || "Dështoi fshirja e instruktorit");
        setIsDeleting(false);
        return;
      }

      toast("success", "Instruktori u fshi me sukses");
      setInstructorToDelete(null);
      setRefreshKey((prev) => prev + 1); // Refresh the list
    } catch (error: any) {
      console.error("Error deleting instructor:", error);
      toast(
        "error",
        error?.message || "Failed to delete instructor. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const actions = (instructor: InstructorRow) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditingInstructor(instructor)}
        icon={<EditIcon className="w-4 h-4" />}
      >
        Ndrysho
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDeleteClick(instructor)}
        icon={<TrashIcon className="w-4 h-4" />}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        Fshi
      </Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instruktorët</h1>
          <p className="text-gray-500 mt-1">
            Menaxhoni instruktorët e makinës dhe caktimet e tyre.
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          icon={<PlusIcon className="w-4 h-4" />}
        >
          Shto instruktor
        </Button>
      </div>

      {/* Filters */}
      <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <div className="w-full sm:w-48">
          <Select
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              {
                value: "",
                label: "All Statuses",
              },
              {
                value: "active",
                label: "Active",
              },
              {
                value: "inactive",
                label: "Inactive",
              },
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            placeholder="Të gjitha kategoritë"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: "", label: "Të gjitha kategoritë" },
              ...licenseCategories.map((cat) => ({
                value: cat,
                label: `Kategoria ${cat}`,
              })),
            ]}
          />
        </div>
      </FilterBar>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredInstructors}
          columns={columns}
          keyExtractor={(instructor) => instructor.id}
          searchable
          searchPlaceholder="Search instructors..."
          searchKeys={["firstName", "lastName", "email", "phone"]}
          actions={actions}
          emptyMessage="No instructors found"
        />
      </Card>

      {/* Add/Edit Modal */}
      <AddInstructorModal
        isOpen={showAddModal || !!editingInstructor}
        onClose={() => {
          setShowAddModal(false);
          setEditingInstructor(null);
        }}
        instructor={editingInstructor}
        cars={cars}
        licenseCategories={licenseCategories}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          setShowAddModal(false);
          setEditingInstructor(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!instructorToDelete}
        onClose={() => setInstructorToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Fshi instruktorin"
        message={`Jeni të sigurt që dëshironi të fshini ${instructorToDelete?.firstName} ${instructorToDelete?.lastName}? Ky veprim nuk mund të kthehet.`}
        confirmText="Po, fshi"
        cancelText="Anulo"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
type AddInstructorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  instructor?: InstructorRow | null;
  cars: Car[];
  licenseCategories: string[];
  onSuccess: () => void;
};
function AddInstructorModal({
  isOpen,
  onClose,
  instructor,
  cars,
  licenseCategories,
  onSuccess,
}: AddInstructorModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    personalNumber: "",
    address: "",
    categories: [] as string[],
    assignedCarIds: [] as string[],
    status: "active" as "active" | "inactive",
    instructorType: "insider" as "insider" | "outsider",
    ratePerHour: 0,
    debtPerHour: 0,
    hasPersonalCar: false,
    personalCar: {
      model: "",
      yearOfManufacture: new Date().getFullYear(),
      chassisNumber: "",
      transmission: "manual" as "manual" | "automatic",
      fuelType: "petrol" as "petrol" | "diesel" | "electric" | "hybrid",
      licensePlate: "",
      ownership: "instructor" as "owned" | "instructor",
      registrationExpiry: "",
      lastInspection: "",
      nextInspection: "",
      status: "active" as "active" | "inactive",
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Emri është i detyrueshëm";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Mbiemri është i detyrueshëm";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Emaili është i detyrueshëm";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Vendosni një adresë email të vlefshme";
      }
    }

    if (!instructor) {
      if (!formData.password) {
        newErrors.password = "Fjalëkalimi është i detyrueshëm";
      } else if (formData.password.length < 6) {
        newErrors.password = "Fjalëkalimi duhet të ketë të paktën 6 karaktere";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Numri i telefonit është i detyrueshëm";
    } else {
      const phoneRegex = /^[\d\s\-\+\(\)]{6,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Vendosni një numër telefoni të vlefshëm";
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = "Adresa është e detyrueshme";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Data e lindjes është e detyrueshme";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.dateOfBirth = "Data e lindjes duhet të jetë në të kaluarën";
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = "Instruktori duhet të jetë të paktën 18 vjeç";
      }
    }

    if (!formData.personalNumber.trim()) {
      newErrors.personalNumber = "Numri personal është i detyrueshëm";
    } else if (formData.personalNumber.trim().length < 6) {
      newErrors.personalNumber =
        "Numri personal duhet të ketë të paktën 6 karaktere";
    }

    // Validate payment fields for outsider
    if (formData.instructorType === 'outsider') {
      if (formData.ratePerHour < 0) {
        newErrors.ratePerHour = "Paga për orë duhet të jetë pozitive";
      }
    }

    if (formData.hasPersonalCar && !instructor) {
      if (!formData.personalCar.model.trim()) {
        newErrors.personalCarModel = "Modeli i makinës është i detyrueshëm";
      }
      if (!formData.personalCar.yearOfManufacture) {
        newErrors.personalCarYear = "Viti i prodhimit është i detyrueshëm";
      }
      if (!formData.personalCar.chassisNumber.trim()) {
        newErrors.personalCarChassis = "Numri i shasisë është i detyrueshëm";
      }
      if (!formData.personalCar.licensePlate.trim()) {
        newErrors.personalCarLicensePlate = "Targa është e detyrueshme";
      }
      if (!formData.personalCar.registrationExpiry) {
        newErrors.personalCarRegExpiry = "Skadenca e regjistrimit është e detyrueshme";
      }
      if (!formData.personalCar.lastInspection) {
        newErrors.personalCarLastInspection = "Data e inspektimit të fundit është e detyrueshme";
      }
      if (!formData.personalCar.nextInspection) {
        newErrors.personalCarNextInspection = "Data e inspektimit të ardhshëm është e detyrueshme";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (instructor) {
      setFormData({
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        email: instructor.email,
        password: "", // Password not needed for editing
        phone: instructor.phone || "",
        dateOfBirth: instructor.dateOfBirth || "",
        personalNumber: instructor.personalNumber || "",
        address: instructor.address || "",
        categories: instructor.categories,
        assignedCarIds: instructor.assignedCarIds,
        status: instructor.status,
            instructorType: (instructor as any).instructorType || "insider",
            ratePerHour: (instructor as any).ratePerHour || 0,
            debtPerHour: 0,
        hasPersonalCar: false, // Personal car editing not supported in edit mode for now
        personalCar: {
          model: "",
          yearOfManufacture: new Date().getFullYear(),
          chassisNumber: "",
          transmission: "manual",
          fuelType: "petrol",
          licensePlate: "",
          ownership: "instructor",
          registrationExpiry: "",
          lastInspection: "",
          nextInspection: "",
          status: "active",
        },
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        dateOfBirth: "",
        personalNumber: "",
        address: "",
        categories: [],
        assignedCarIds: [],
        status: "active",
        instructorType: "insider",
        ratePerHour: 0,
        debtPerHour: 0,
        hasPersonalCar: false,
        personalCar: {
          model: "",
          yearOfManufacture: new Date().getFullYear(),
          chassisNumber: "",
          transmission: "manual",
          fuelType: "petrol",
          licensePlate: "",
          ownership: "instructor",
          registrationExpiry: "",
          lastInspection: "",
          nextInspection: "",
          status: "active",
        },
      });
    }
    // Clear errors when form data changes
    setErrors({});
  }, [instructor]);

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("=== FORM SUBMISSION START ===");
    console.log("Form submitted", { instructor, formData });

    // Validate form before submission
    const isValid = validateForm();
    console.log("Validation result:", isValid);
    console.log("Current errors:", errors);

    if (!isValid) {
      console.log("❌ Validation failed, errors:", errors);
      toast("error", "Ju lutemi korrigjoni gabimet në formular");
      return;
    }

    console.log("✅ Validation passed, proceeding with submission...");
    setLoading(true);
    setErrors({}); // Clear errors on submit

    try {
      if (instructor) {
        // Update existing instructor
        const result = await api.updateInstructor(instructor.id, {
          phone: formData.phone,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          personalNumber: formData.personalNumber,
          specialties: formData.categories,
          assignedCarIds: formData.assignedCarIds,
          status: formData.status,
          instructorType: formData.instructorType,
          ratePerHour: formData.instructorType === 'outsider' ? formData.ratePerHour : 0,
          debtPerHour: 0,
        });

        if (!result.ok) {
          toast("error", result.data?.message || "Dështoi përditësimi i instruktorit");
          setLoading(false);
          return;
        }

        toast("success", "Instruktori u përditësua me sukses");
        onSuccess();
      } else {
        // Create new instructor via backend
        console.log("Creating instructor with data:", {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          personalNumber: formData.personalNumber,
          specialties: formData.categories,
          assignedCarIds: formData.assignedCarIds,
        });

        const result = await api.createInstructor({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          personalNumber: formData.personalNumber,
          specialties: formData.categories,
          assignedCarIds: formData.assignedCarIds,
          instructorType: formData.instructorType,
          ratePerHour: formData.instructorType === 'outsider' ? formData.ratePerHour : 0,
          debtPerHour: 0,
          personalCar: formData.hasPersonalCar ? formData.personalCar : undefined,
        });

        console.log("Create instructor result:", result);
        console.log("Result OK:", result.ok);
        console.log("Result status:", result.status);
        console.log("Result data:", result.data);

        if (!result.ok) {
          const errorMessage =
            result.data?.message || "Dështoi krijimi i instruktorit";
          console.error("❌ Failed to create instructor:", errorMessage);
          toast("error", errorMessage);

          // Handle specific validation errors from backend
          if (result.data && typeof result.data === "object") {
            const backendErrors: Record<string, string> = {};
            if (result.data.message?.includes("email")) {
              backendErrors.email = result.data.message;
            }
            if (result.data.message?.includes("personal number")) {
              backendErrors.personalNumber = result.data.message;
            }
            if (Object.keys(backendErrors).length > 0) {
              setErrors(backendErrors);
            }
          }

          setLoading(false);
          return;
        }

        console.log("✅ Instructor created successfully!");
        toast(
          "success",
          "Instruktori u krijua me sukses! Tani mund të hyjnë me email dhe fjalëkalimin e tyre."
        );
        onSuccess();
      }
    } catch (error: any) {
      console.error("❌ Exception caught while saving instructor:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      toast(
        "error",
        error?.message || "Dështoi ruajtja e instruktorit. Ju lutemi provoni përsëri."
      );
    } finally {
      console.log("=== FORM SUBMISSION END ===");
      setLoading(false);
    }
  };
  const handleButtonClick = () => {
    // Manually trigger form submission
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={instructor ? "Ndrysho instruktorin" : "Shto instruktor të ri"}
      description="Vendosni të dhënat e instruktorit për ta regjistruar në sistem."
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Anulo
          </Button>
          <Button
            type="button"
            onClick={handleButtonClick}
            loading={loading}
            disabled={loading}
          >
            {instructor ? "Ruaj ndryshimet" : "Shto instruktor"}
          </Button>
        </div>
      }
    >
      <form
        ref={formRef}
        className="space-y-6"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Emri"
            required
            value={formData.firstName}
            error={errors.firstName}
            onChange={(e) => {
              setFormData({ ...formData, firstName: e.target.value });
              if (errors.firstName) setErrors({ ...errors, firstName: "" });
            }}
          />
          <Input
            label="Mbiemri"
            required
            value={formData.lastName}
            error={errors.lastName}
            onChange={(e) => {
              setFormData({ ...formData, lastName: e.target.value });
              if (errors.lastName) setErrors({ ...errors, lastName: "" });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Emaili"
            type="email"
            required
            value={formData.email}
            error={errors.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
          />
          <Input
            label="Telefoni"
            type="tel"
            required
            value={formData.phone}
            error={errors.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value });
              if (errors.phone) setErrors({ ...errors, phone: "" });
            }}
          />
        </div>
        <Input
          label="Adresa"
          required
          value={formData.address}
          error={errors.address}
          onChange={(e) => {
            setFormData({ ...formData, address: e.target.value });
            if (errors.address) setErrors({ ...errors, address: "" });
          }}
        />

        {!instructor && (
          <Input
            label="Fjalëkalimi"
            type="password"
            required
            value={formData.password}
            error={errors.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: "" });
            }}
            hint="Të paktën 6 karaktere. Instruktori do ta përdorë për të hyrë."
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data e lindjes"
            type="date"
            required
            value={formData.dateOfBirth}
            error={errors.dateOfBirth}
            onChange={(e) => {
              setFormData({ ...formData, dateOfBirth: e.target.value });
              if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: "" });
            }}
          />
          <Input
            label="Numri personal"
            required
            value={formData.personalNumber}
            error={errors.personalNumber}
            onChange={(e) => {
              setFormData({ ...formData, personalNumber: e.target.value });
              if (errors.personalNumber)
                setErrors({ ...errors, personalNumber: "" });
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategoritë e patentës
          </label>
          <div className="grid grid-cols-4 gap-2">
            {licenseCategories.map((category) => (
              <Checkbox
                key={category}
                label={category}
                checked={formData.categories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
              />
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lloji i pagesës
          </label>
          <Select
            value={formData.instructorType}
            onChange={(e) => {
              const newType = e.target.value as "insider" | "outsider";
              setFormData((prev) => ({
                ...prev,
              instructorType: newType,
              // Reset rate when switching to insider
              ratePerHour: newType === "insider" ? 0 : prev.ratePerHour,
              debtPerHour: 0,
              }));
            }}
            options={[
              { value: "insider", label: "Rrogë fikse (Insider)" },
              { value: "outsider", label: "Me orë (Outsider)" },
            ]}
          />
          {formData.instructorType === "outsider" && (
            <div className="mt-4">
              <Input
                label="Paga për orë (€)"
                type="number"
                required
                value={formData.ratePerHour.toString()}
                error={errors.ratePerHour}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData((prev) => ({
                    ...prev,
                    ratePerHour: value >= 0 ? value : 0,
                  }));
                  if (errors.ratePerHour) setErrors({ ...errors, ratePerHour: "" });
                }}
                hint="Sa paguhet instruktori për çdo orë të përfunduar"
              />
            </div>
          )}
        </div>

        {!instructor && (
          <div className="border-t pt-4">
            <Checkbox
              label="Instruktori ka makinën e vet personale"
              checked={formData.hasPersonalCar}
              onChange={(checked) => {
                setFormData((prev) => ({
                  ...prev,
                  hasPersonalCar: checked,
                }));
              }}
            />
            {formData.hasPersonalCar && (
              <div className="mt-4 space-y-5 p-5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    Të dhënat e makinës personale
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Vendosni detajet e mjetit personal të instruktorit
                  </p>
                </div>
                
                <div className="space-y-5">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Të dhënat themelore</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Modeli"
                        required={formData.hasPersonalCar}
                        value={formData.personalCar.model}
                        error={errors.personalCarModel}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            personalCar: { ...prev.personalCar, model: e.target.value },
                          }));
                          if (errors.personalCarModel)
                            setErrors({ ...errors, personalCarModel: "" });
                        }}
                      />
                      <Input
                        label="Viti i prodhimit"
                        type="number"
                        required={formData.hasPersonalCar}
                        value={formData.personalCar.yearOfManufacture}
                        error={errors.personalCarYear}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            personalCar: {
                              ...prev.personalCar,
                              yearOfManufacture: parseInt(e.target.value) || new Date().getFullYear(),
                            },
                          }));
                          if (errors.personalCarYear)
                            setErrors({ ...errors, personalCarYear: "" });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Input
                        label="Numri i shasisë"
                        required={formData.hasPersonalCar}
                        value={formData.personalCar.chassisNumber}
                        error={errors.personalCarChassis}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            personalCar: {
                              ...prev.personalCar,
                              chassisNumber: e.target.value,
                            },
                          }));
                          if (errors.personalCarChassis)
                            setErrors({ ...errors, personalCarChassis: "" });
                        }}
                      />
                      <Input
                        label="Targë"
                        required={formData.hasPersonalCar}
                        value={formData.personalCar.licensePlate}
                        error={errors.personalCarLicensePlate}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            personalCar: {
                              ...prev.personalCar,
                              licensePlate: e.target.value.toUpperCase(),
                            },
                          }));
                          if (errors.personalCarLicensePlate)
                            setErrors({ ...errors, personalCarLicensePlate: "" });
                        }}
                      />
                    </div>
                  </div>

                  {/* Specifications */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Specifikimet</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <Select
                        label="Transmisioni"
                        required={formData.hasPersonalCar}
                        value={formData.personalCar.transmission}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            personalCar: {
                              ...prev.personalCar,
                              transmission: e.target.value as "manual" | "automatic",
                            },
                          }));
                        }}
                        options={[
                          { value: "manual", label: "Manuale" },
                          { value: "automatic", label: "Automatik" },
                        ]}
                      />
                      <Select
                        label="Lloji i karburantit"
                        required={formData.hasPersonalCar}
                        value={formData.personalCar.fuelType}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            personalCar: {
                              ...prev.personalCar,
                              fuelType: e.target.value as "petrol" | "diesel" | "electric" | "hybrid",
                            },
                          }));
                        }}
                        options={[
                          { value: "petrol", label: "Benzinë" },
                          { value: "diesel", label: "Naftë" },
                          { value: "electric", label: "Elektrik" },
                          { value: "hybrid", label: "Hibrid" },
                        ]}
                      />
                      <Input
                        label="Pronësia"
                        value="Instruktor"
                        disabled
                        hint="Makinat personale janë gjithmonë të instruktorit"
                      />
                    </div>
                  </div>

                  {/* Inspection & Registration */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Inspektimi dhe regjistrimi</h4>
                    <div className="space-y-4">
                      <Input
                        label="Skadenca e regjistrimit"
                        type="date"
                        required={formData.hasPersonalCar}
                        value={formData.personalCar.registrationExpiry}
                        error={errors.personalCarRegExpiry}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            personalCar: {
                              ...prev.personalCar,
                              registrationExpiry: e.target.value,
                            },
                          }));
                          if (errors.personalCarRegExpiry)
                            setErrors({ ...errors, personalCarRegExpiry: "" });
                        }}
                      />
                      <Input
                        label="Inspektimi i fundit"
                        type="date"
                        required={formData.hasPersonalCar}
                        value={formData.personalCar.lastInspection}
                        error={errors.personalCarLastInspection}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            personalCar: {
                              ...prev.personalCar,
                              lastInspection: e.target.value,
                            },
                          }));
                          if (errors.personalCarLastInspection)
                            setErrors({ ...errors, personalCarLastInspection: "" });
                        }}
                      />
                      <Input
                        label="Inspektimi i ardhshëm"
                        type="date"
                        required={formData.hasPersonalCar}
                        value={formData.personalCar.nextInspection}
                        error={errors.personalCarNextInspection}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            personalCar: {
                              ...prev.personalCar,
                              nextInspection: e.target.value,
                            },
                          }));
                          if (errors.personalCarNextInspection)
                            setErrors({ ...errors, personalCarNextInspection: "" });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {instructor && instructor.personalCarIds && instructor.personalCarIds.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Shënim:</strong> Ky instruktor ka makinë personale. Mund të caktoni edhe makina të shkollës përveç makinës së tyre personale.
            </p>
          </div>
        )}

        <Select
          label="Cakto makina të shkollës (opsionale)"
          value=""
          onChange={(e) => {
            if (
              e.target.value &&
              !formData.assignedCarIds.includes(e.target.value)
            ) {
              setFormData((prev) => ({
                ...prev,
                assignedCarIds: [...prev.assignedCarIds, e.target.value],
              }));
            }
          }}
          options={cars
            .filter((c) => {
              // Filter out personal cars (cars with instructorId)
              if (c.status !== "active" || c.instructorId) return false;
              // Also filter out personal cars of the instructor being edited
              if (instructor && instructor.personalCarIds?.includes(c.id)) return false;
              return true;
            })
            .map((car) => ({
              value: car.id,
              label: `${car.model} (${car.licensePlate})`,
              disabled: formData.assignedCarIds.includes(car.id),
            }))}
          placeholder="Zgjidhni makina për t'u caktuar"
        />
        {formData.assignedCarIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.assignedCarIds.map((carId) => {
              const car = cars.find((c) => c.id === carId);
              return car ? (
                <button
                  key={carId}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      assignedCarIds: prev.assignedCarIds.filter(
                        (id) => id !== carId
                      ),
                    }))
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                >
                  <Badge variant="info">{car.licensePlate}</Badge>
                  <span>×</span>
                </button>
              ) : null;
            })}
          </div>
        )}
      </form>
    </Modal>
  );
}
