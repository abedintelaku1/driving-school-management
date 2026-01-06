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
import { licenseCategories } from "../../utils/mockData";
import { toast } from "../../hooks/useToast";
import { api } from "../../utils/api";

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
  const [cars, setCars] = useState<any[]>([]);

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

  // Fetch cars from API
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const result = await api.listCars();
        if (result.ok && result.data) {
          setCars(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch cars", err);
      }
    };
    fetchCars();
  }, []);

  const filteredInstructors = useMemo(() => {
    return rows.filter((instructor) => {
      if (statusFilter && instructor.status !== statusFilter) return false;
      if (categoryFilter && !instructor.categories.includes(categoryFilter))
        return false;
      return true;
    });
  }, [statusFilter, categoryFilter, rows]);
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
      label: "Assigned Cars",
      render: (value: unknown) => {
        const carIds = value as string[];
        const carsList = carIds
          .map((id) => {
            // Find car by _id or id
            return cars.find((c) => (c._id || c.id) === id);
          })
          .filter(Boolean);
        return carsList.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {carsList.map((car) => (
              <Badge key={car!._id || car!.id} variant="outline" size="sm">
                {car!.licensePlate}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">None</span>
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
        toast("error", result.data?.message || "Failed to delete instructor");
        setIsDeleting(false);
        return;
      }

      toast("success", "Instructor deleted successfully");
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
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDeleteClick(instructor)}
        icon={<TrashIcon className="w-4 h-4" />}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        Delete
      </Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
          <p className="text-gray-500 mt-1">
            Manage driving instructors and their assignments.
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          icon={<PlusIcon className="w-4 h-4" />}
        >
          Add Instructor
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="w-48">
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
          <div className="w-48">
            <Select
              placeholder="All Categories"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                {
                  value: "",
                  label: "All Categories",
                },
                ...licenseCategories.map((cat) => ({
                  value: cat,
                  label: `Category ${cat}`,
                })),
              ]}
            />
          </div>
        </div>
      </Card>

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
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          setShowAddModal(false);
          setEditingInstructor(null);
        }}
        cars={cars}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!instructorToDelete}
        onClose={() => setInstructorToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Instructor"
        message={`Are you sure you want to delete ${instructorToDelete?.firstName} ${instructorToDelete?.lastName}? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
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
  onSuccess: () => void;
  cars: any[];
};
function AddInstructorModal({
  isOpen,
  onClose,
  instructor,
  onSuccess,
  cars,
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
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!instructor) {
      // Password only required when creating new instructor
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      // Basic phone validation (at least 6 digits)
      const phoneRegex = /^[\d\s\-\+\(\)]{6,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.dateOfBirth = "Date of birth must be in the past";
      }
      // Check if age is reasonable (at least 18 years old)
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = "Instructor must be at least 18 years old";
      }
    }

    if (!formData.personalNumber.trim()) {
      newErrors.personalNumber = "Personal number is required";
    } else if (formData.personalNumber.trim().length < 6) {
      newErrors.personalNumber =
        "Personal number must be at least 6 characters";
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
      toast("error", "Please fix the errors in the form");
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
        });

        if (!result.ok) {
          toast("error", result.data?.message || "Failed to update instructor");
          setLoading(false);
          return;
        }

        toast("success", "Instructor updated successfully");
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
        });

        console.log("Create instructor result:", result);
        console.log("Result OK:", result.ok);
        console.log("Result status:", result.status);
        console.log("Result data:", result.data);

        if (!result.ok) {
          const errorMessage =
            result.data?.message || "Failed to create instructor";
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
          "Instructor created successfully! They can now login with their email and password."
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
        error?.message || "Failed to save instructor. Please try again."
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
      title={instructor ? "Edit Instructor" : "Add New Instructor"}
      description="Enter the instructor's information to register them in the system."
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleButtonClick}
            loading={loading}
            disabled={loading}
          >
            {instructor ? "Save Changes" : "Add Instructor"}
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
            label="First Name"
            required
            value={formData.firstName}
            error={errors.firstName}
            onChange={(e) => {
              setFormData({ ...formData, firstName: e.target.value });
              if (errors.firstName) setErrors({ ...errors, firstName: "" });
            }}
          />
          <Input
            label="Last Name"
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
            label="Email"
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
            label="Phone"
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
          label="Address"
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
            label="Password"
            type="password"
            required
            value={formData.password}
            error={errors.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: "" });
            }}
            hint="Minimum 6 characters. Instructor will use this to login."
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date of Birth"
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
            label="Personal Number"
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
            License Categories
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

        <Select
          label="Assign Cars"
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
            .filter((c) => c.status === "active")
            .map((car) => ({
              value: car._id || car.id,
              label: `${car.model} (${car.licensePlate})`,
              disabled: formData.assignedCarIds.includes(car._id || car.id),
            }))}
          placeholder="Select cars to assign"
        />
        {formData.assignedCarIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.assignedCarIds.map((carId) => {
              const car = cars.find((c) => (c._id || c.id) === carId);
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
