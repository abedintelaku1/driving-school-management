// Core entity types for Drivers Hub

export type UserRole = 0 | 1 | 2; // 0 = Admin, 1 = Instructor, 2 = Staff
export type PaymentMethod = "bank" | "cash";
export type PaymentFrequency = "deposit" | "one-time" | "installments";
export type TransmissionType = "manual" | "automatic";
export type FuelType = "petrol" | "diesel" | "electric" | "hybrid";
export type OwnershipType = "owned" | "leased" | "rented" | "instructor";
export type DocumentStatus = "pending" | "submitted" | "approved" | "rejected";
export type EntityStatus = "active" | "inactive";
export type User = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatar?: string;
};
export type Candidate = {
  id: string;
  uniqueClientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  personalNumber: string;
  address: string;
  phone: string;
  email: string;
  status: EntityStatus;
  packageId?: string;
  instructorId?: string;
  carId?: string;
  paymentFrequency?: PaymentFrequency;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
};
export type DocumentType = "PDF" | "JPG" | "PNG" | "DOCX";

export type DocumentUploadedBy = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: number; // 0 = Admin, 1 = Instructor, 2 = Staff
};

export type Document = {
  _id?: string;
  id?: string;
  name: string;
  type: DocumentType;
  uploadDate: string;
  updatedDate?: string;
  uploadedBy: DocumentUploadedBy | string;
  filePath: string;
  fileSize?: number;
  originalName: string;
  // Legacy fields (for backward compatibility)
  status?: DocumentStatus;
  submittedAt?: string;
  approvedAt?: string;
  notes?: string;
};
export type Car = {
  id: string;
  model: string;
  yearOfManufacture: number;
  chassisNumber: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  licensePlate: string;
  ownership: OwnershipType;
  registrationExpiry: string;
  lastInspection: string;
  nextInspection: string;
  totalHours: number;
  status: EntityStatus;
  instructorId?: string | null; // For personal cars
  createdAt: string;
  updatedAt: string;
};
export type Instructor = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  personalNumber: string;
  address: string;
  phone: string;
  email: string;
  categories: string[];
  assignedCarIds: string[];
  personalCarIds?: string[]; // Personal cars owned by this instructor
  status: EntityStatus;
  totalHours: number;
  instructorType?: "insider" | "outsider";
  ratePerHour?: number;
  debtPerHour?: number;
  totalCredits?: number;
  totalDebt?: number;
  createdAt: string;
  updatedAt: string;
};
export type Package = {
  id: string;
  name: string;
  category: string;
  numberOfHours: number;
  price: number;
  description?: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
};
export type PaymentAddedBy = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type Payment = {
  id: string;
  candidateId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  packageId?: string;
  notes?: string;
  createdAt: string;
  addedBy?: PaymentAddedBy | null;
};
export type Appointment = {
  id: string;
  instructorId: string;
  candidateId: string;
  carId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

// Form types
export type CandidateFormData = Omit<
  Candidate,
  "id" | "documents" | "createdAt" | "updatedAt"
>;
export type CarFormData = Omit<
  Car,
  "id" | "totalHours" | "createdAt" | "updatedAt"
>;
export type InstructorFormData = Omit<
  Instructor,
  "id" | "totalHours" | "createdAt" | "updatedAt"
>;
export type PackageFormData = Omit<Package, "id" | "createdAt" | "updatedAt">;
export type PaymentFormData = Omit<Payment, "id" | "createdAt">;
export type AppointmentFormData = Omit<
  Appointment,
  "id" | "createdAt" | "updatedAt"
>;

// Table column definition
export type Column<T> = {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
};

// Filter types
export type DateRange = {
  from: string;
  to: string;
};
export type ReportFilter = {
  dateRange?: DateRange;
  entityType?: "candidates" | "cars" | "instructors" | "payments";
  status?: EntityStatus;
};
