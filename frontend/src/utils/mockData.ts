import type { Candidate, Car, Instructor, Package, Payment, Appointment, Document, User } from '../types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Mock Users
export const mockUsers: User[] = [{
  id: '1',
  email: 'admin@drivershub.com',
  role: 0, // 0 = admin
  firstName: 'Admin',
  lastName: 'User'
}, {
  id: '2',
  email: 'john.instructor@drivershub.com',
  role: 1, // 1 = instructor
  firstName: 'John',
  lastName: 'Smith'
}, {
  id: '3',
  email: 'maria.instructor@drivershub.com',
  role: 1, // 1 = instructor
  firstName: 'Maria',
  lastName: 'Garcia'
}];

// Required documents for candidates
export const requiredDocuments: string[] = ['ID Card / Passport', 'Medical Certificate', 'Proof of Address', 'Passport Photo (2x)', 'Previous License (if applicable)', 'Vision Test Certificate'];

// Mock Documents
const createDocuments = (): Document[] => requiredDocuments.map((name, index) => ({
  id: generateId(),
  name,
  status: index < 3 ? 'approved' : index < 5 ? 'submitted' : 'pending',
  submittedAt: index < 5 ? '2024-01-15' : undefined,
  approvedAt: index < 3 ? '2024-01-16' : undefined
}));

// In-memory data stores (mutable for CRUD operations)
export let mockCandidates: Candidate[] = [{
  id: '1',
  uniqueClientNumber: 'DH-2024-001',
  firstName: 'Alex',
  lastName: 'Johnson',
  dateOfBirth: '1998-05-15',
  personalNumber: '9805150123',
  address: '123 Main Street, City Center',
  phone: '+1 555-0101',
  email: 'alex.johnson@email.com',
  status: 'active',
  packageId: '1',
  instructorId: '2',
  carId: '1',
  paymentFrequency: 'installments',
  documents: createDocuments(),
  createdAt: '2024-01-10',
  updatedAt: '2024-01-20'
}, {
  id: '2',
  uniqueClientNumber: 'DH-2024-002',
  firstName: 'Sarah',
  lastName: 'Williams',
  dateOfBirth: '2000-08-22',
  personalNumber: '0008220456',
  address: '456 Oak Avenue, Suburb',
  phone: '+1 555-0102',
  email: 'sarah.w@email.com',
  status: 'active',
  packageId: '2',
  instructorId: '3',
  carId: '2',
  paymentFrequency: 'one-time',
  documents: createDocuments(),
  createdAt: '2024-01-12',
  updatedAt: '2024-01-18'
}, {
  id: '3',
  uniqueClientNumber: 'DH-2024-003',
  firstName: 'Michael',
  lastName: 'Brown',
  dateOfBirth: '1995-03-10',
  personalNumber: '9503100789',
  address: '789 Pine Road, Downtown',
  phone: '+1 555-0103',
  email: 'michael.b@email.com',
  status: 'inactive',
  packageId: '1',
  instructorId: '2',
  paymentFrequency: 'deposit',
  documents: createDocuments(),
  createdAt: '2024-01-05',
  updatedAt: '2024-01-15'
}, {
  id: '4',
  uniqueClientNumber: 'DH-2024-004',
  firstName: 'Emma',
  lastName: 'Davis',
  dateOfBirth: '1999-11-28',
  personalNumber: '9911280321',
  address: '321 Elm Street, Westside',
  phone: '+1 555-0104',
  email: 'emma.davis@email.com',
  status: 'active',
  packageId: '3',
  instructorId: '3',
  carId: '3',
  paymentFrequency: 'installments',
  documents: createDocuments(),
  createdAt: '2024-01-08',
  updatedAt: '2024-01-22'
}, {
  id: '5',
  uniqueClientNumber: 'DH-2024-005',
  firstName: 'James',
  lastName: 'Wilson',
  dateOfBirth: '1997-07-04',
  personalNumber: '9707040654',
  address: '654 Maple Drive, Eastside',
  phone: '+1 555-0105',
  email: 'james.wilson@email.com',
  status: 'active',
  packageId: '2',
  instructorId: '2',
  carId: '1',
  paymentFrequency: 'one-time',
  documents: createDocuments(),
  createdAt: '2024-01-14',
  updatedAt: '2024-01-21'
}];
export let mockCars: Car[] = [{
  id: '1',
  model: 'Toyota Corolla',
  yearOfManufacture: 2022,
  chassisNumber: 'JTDKN3DU5A0123456',
  transmission: 'manual',
  fuelType: 'petrol',
  licensePlate: 'ABC-1234',
  ownership: 'owned',
  registrationExpiry: '2025-06-15',
  lastInspection: '2024-01-10',
  nextInspection: '2024-07-10',
  totalHours: 245,
  status: 'active',
  createdAt: '2023-06-01',
  updatedAt: '2024-01-20'
}, {
  id: '2',
  model: 'Volkswagen Golf',
  yearOfManufacture: 2021,
  chassisNumber: 'WVWZZZ1KZAW123456',
  transmission: 'automatic',
  fuelType: 'diesel',
  licensePlate: 'XYZ-5678',
  ownership: 'leased',
  registrationExpiry: '2025-03-20',
  lastInspection: '2023-12-15',
  nextInspection: '2024-06-15',
  totalHours: 312,
  status: 'active',
  createdAt: '2023-04-15',
  updatedAt: '2024-01-18'
}, {
  id: '3',
  model: 'Honda Civic',
  yearOfManufacture: 2023,
  chassisNumber: '2HGFC2F59NH123456',
  transmission: 'manual',
  fuelType: 'hybrid',
  licensePlate: 'DEF-9012',
  ownership: 'owned',
  registrationExpiry: '2025-09-30',
  lastInspection: '2024-01-05',
  nextInspection: '2024-07-05',
  totalHours: 128,
  status: 'active',
  createdAt: '2023-09-01',
  updatedAt: '2024-01-22'
}, {
  id: '4',
  model: 'Ford Focus',
  yearOfManufacture: 2020,
  chassisNumber: '1FAHP3F29CL123456',
  transmission: 'manual',
  fuelType: 'petrol',
  licensePlate: 'GHI-3456',
  ownership: 'rented',
  registrationExpiry: '2024-04-10',
  lastInspection: '2023-10-10',
  nextInspection: '2024-04-10',
  totalHours: 456,
  status: 'inactive',
  createdAt: '2022-01-15',
  updatedAt: '2024-01-10'
}];
export let mockInstructors: Instructor[] = [{
  id: '2',
  firstName: 'John',
  lastName: 'Smith',
  dateOfBirth: '1985-04-12',
  personalNumber: '8504120123',
  address: '100 Instructor Lane, City',
  phone: '+1 555-0201',
  email: 'john.instructor@drivershub.com',
  categories: ['B', 'B1'],
  assignedCarIds: ['1', '4'],
  status: 'active',
  totalHours: 1250,
  createdAt: '2022-01-01',
  updatedAt: '2024-01-20'
}, {
  id: '3',
  firstName: 'Maria',
  lastName: 'Garcia',
  dateOfBirth: '1990-09-25',
  personalNumber: '9009250456',
  address: '200 Teacher Road, Suburb',
  phone: '+1 555-0202',
  email: 'maria.instructor@drivershub.com',
  categories: ['B', 'B1', 'A', 'A1'],
  assignedCarIds: ['2', '3'],
  status: 'active',
  totalHours: 890,
  createdAt: '2022-06-15',
  updatedAt: '2024-01-18'
}, {
  id: '4',
  firstName: 'Robert',
  lastName: 'Taylor',
  dateOfBirth: '1978-12-03',
  personalNumber: '7812030789',
  address: '300 Coach Street, Downtown',
  phone: '+1 555-0203',
  email: 'robert.t@drivershub.com',
  categories: ['B', 'C', 'D'],
  assignedCarIds: [],
  status: 'inactive',
  totalHours: 2100,
  createdAt: '2020-03-01',
  updatedAt: '2023-12-01'
}];
export let mockPackages: Package[] = [{
  id: '1',
  name: 'Basic Package',
  category: 'B',
  numberOfHours: 20,
  price: 800,
  description: 'Standard driving course for category B license',
  status: 'active',
  createdAt: '2023-01-01',
  updatedAt: '2024-01-01'
}, {
  id: '2',
  name: 'Premium Package',
  category: 'B',
  numberOfHours: 30,
  price: 1100,
  description: 'Extended course with additional practice hours',
  status: 'active',
  createdAt: '2023-01-01',
  updatedAt: '2024-01-01'
}, {
  id: '3',
  name: 'Intensive Course',
  category: 'B',
  numberOfHours: 40,
  price: 1400,
  description: 'Fast-track intensive driving course',
  status: 'active',
  createdAt: '2023-01-01',
  updatedAt: '2024-01-01'
}, {
  id: '4',
  name: 'Motorcycle Basic',
  category: 'A',
  numberOfHours: 15,
  price: 600,
  description: 'Basic motorcycle training course',
  status: 'active',
  createdAt: '2023-01-01',
  updatedAt: '2024-01-01'
}, {
  id: '5',
  name: 'Refresher Course',
  category: 'B',
  numberOfHours: 10,
  price: 400,
  description: 'For licensed drivers needing practice',
  status: 'inactive',
  createdAt: '2023-01-01',
  updatedAt: '2023-06-01'
}];
export let mockPayments: Payment[] = [{
  id: '1',
  candidateId: '1',
  amount: 300,
  method: 'bank',
  date: '2024-01-10',
  packageId: '1',
  notes: 'First installment',
  createdAt: '2024-01-10'
}, {
  id: '2',
  candidateId: '1',
  amount: 250,
  method: 'bank',
  date: '2024-01-25',
  packageId: '1',
  notes: 'Second installment',
  createdAt: '2024-01-25'
}, {
  id: '3',
  candidateId: '2',
  amount: 1100,
  method: 'bank',
  date: '2024-01-12',
  packageId: '2',
  notes: 'Full payment',
  createdAt: '2024-01-12'
}, {
  id: '4',
  candidateId: '4',
  amount: 500,
  method: 'cash',
  date: '2024-01-08',
  packageId: '3',
  notes: 'Deposit payment',
  createdAt: '2024-01-08'
}, {
  id: '5',
  candidateId: '5',
  amount: 1100,
  method: 'bank',
  date: '2024-01-14',
  packageId: '2',
  notes: 'Full payment',
  createdAt: '2024-01-14'
}, {
  id: '6',
  candidateId: '4',
  amount: 450,
  method: 'bank',
  date: '2024-01-20',
  packageId: '3',
  notes: 'Second installment',
  createdAt: '2024-01-20'
}];
export let mockAppointments: Appointment[] = [{
  id: '1',
  instructorId: '2',
  candidateId: '1',
  carId: '1',
  date: '2024-01-25',
  startTime: '09:00',
  endTime: '11:00',
  hours: 2,
  notes: 'City driving practice',
  status: 'completed',
  createdAt: '2024-01-20',
  updatedAt: '2024-01-25'
}, {
  id: '2',
  instructorId: '2',
  candidateId: '5',
  carId: '1',
  date: '2024-01-25',
  startTime: '14:00',
  endTime: '16:00',
  hours: 2,
  notes: 'Highway driving',
  status: 'completed',
  createdAt: '2024-01-20',
  updatedAt: '2024-01-25'
}, {
  id: '3',
  instructorId: '3',
  candidateId: '2',
  carId: '2',
  date: '2024-01-26',
  startTime: '10:00',
  endTime: '12:00',
  hours: 2,
  notes: 'Parking practice',
  status: 'scheduled',
  createdAt: '2024-01-22',
  updatedAt: '2024-01-22'
}, {
  id: '4',
  instructorId: '3',
  candidateId: '4',
  carId: '3',
  date: '2024-01-26',
  startTime: '14:00',
  endTime: '16:00',
  hours: 2,
  notes: 'Night driving introduction',
  status: 'scheduled',
  createdAt: '2024-01-22',
  updatedAt: '2024-01-22'
}, {
  id: '5',
  instructorId: '2',
  candidateId: '1',
  carId: '1',
  date: '2024-01-27',
  startTime: '09:00',
  endTime: '11:00',
  hours: 2,
  notes: 'Exam preparation',
  status: 'scheduled',
  createdAt: '2024-01-23',
  updatedAt: '2024-01-23'
}, {
  id: '6',
  instructorId: '2',
  candidateId: '3',
  carId: '4',
  date: '2024-01-20',
  startTime: '11:00',
  endTime: '13:00',
  hours: 2,
  status: 'cancelled',
  createdAt: '2024-01-15',
  updatedAt: '2024-01-19'
}];

// License categories
export const licenseCategories = ['AM', 'A1', 'A2', 'A', 'B1', 'B', 'C1', 'C', 'D1', 'D', 'BE', 'CE', 'DE'];

// CRUD Operations for Candidates
export function addCandidate(candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'documents'>): Candidate {
  const newCandidate: Candidate = {
    ...candidate,
    id: generateId(),
    uniqueClientNumber: `DH-2024-${String(mockCandidates.length + 1).padStart(3, '0')}`,
    documents: createDocuments(),
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };
  mockCandidates.push(newCandidate);
  return newCandidate;
}
export function updateCandidate(id: string, updates: Partial<Candidate>): Candidate | null {
  const index = mockCandidates.findIndex(c => c.id === id);
  if (index === -1) return null;
  mockCandidates[index] = {
    ...mockCandidates[index],
    ...updates,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  return mockCandidates[index];
}
export function deleteCandidate(id: string): boolean {
  const index = mockCandidates.findIndex(c => c.id === id);
  if (index === -1) return false;
  mockCandidates.splice(index, 1);
  return true;
}

// CRUD Operations for Cars
export function addCar(car: Omit<Car, 'id' | 'totalHours' | 'createdAt' | 'updatedAt'>): Car {
  const newCar: Car = {
    ...car,
    id: generateId(),
    totalHours: 0,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };
  mockCars.push(newCar);
  return newCar;
}
export function updateCar(id: string, updates: Partial<Car>): Car | null {
  const index = mockCars.findIndex(c => c.id === id);
  if (index === -1) return null;
  mockCars[index] = {
    ...mockCars[index],
    ...updates,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  return mockCars[index];
}
export function deleteCar(id: string): boolean {
  const index = mockCars.findIndex(c => c.id === id);
  if (index === -1) return false;
  mockCars.splice(index, 1);
  return true;
}

// CRUD Operations for Instructors
export function addInstructor(instructor: Omit<Instructor, 'id' | 'totalHours' | 'createdAt' | 'updatedAt'>): Instructor {
  const newInstructor: Instructor = {
    ...instructor,
    id: generateId(),
    totalHours: 0,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };
  mockInstructors.push(newInstructor);
  return newInstructor;
}
export function updateInstructor(id: string, updates: Partial<Instructor>): Instructor | null {
  const index = mockInstructors.findIndex(i => i.id === id);
  if (index === -1) return null;
  mockInstructors[index] = {
    ...mockInstructors[index],
    ...updates,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  return mockInstructors[index];
}
export function deleteInstructor(id: string): boolean {
  const index = mockInstructors.findIndex(i => i.id === id);
  if (index === -1) return false;
  mockInstructors.splice(index, 1);
  return true;
}

// CRUD Operations for Packages
export function addPackage(pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>): Package {
  const newPackage: Package = {
    ...pkg,
    id: generateId(),
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };
  mockPackages.push(newPackage);
  return newPackage;
}
export function updatePackage(id: string, updates: Partial<Package>): Package | null {
  const index = mockPackages.findIndex(p => p.id === id);
  if (index === -1) return null;
  mockPackages[index] = {
    ...mockPackages[index],
    ...updates,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  return mockPackages[index];
}
export function deletePackage(id: string): boolean {
  const index = mockPackages.findIndex(p => p.id === id);
  if (index === -1) return false;
  mockPackages.splice(index, 1);
  return true;
}

// CRUD Operations for Payments
export function addPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Payment {
  const newPayment: Payment = {
    ...payment,
    id: generateId(),
    createdAt: new Date().toISOString().split('T')[0]
  };
  mockPayments.push(newPayment);
  return newPayment;
}
export function deletePayment(id: string): boolean {
  const index = mockPayments.findIndex(p => p.id === id);
  if (index === -1) return false;
  mockPayments.splice(index, 1);
  return true;
}

// CRUD Operations for Appointments
export function addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Appointment {
  const newAppointment: Appointment = {
    ...appointment,
    id: generateId(),
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };
  mockAppointments.push(newAppointment);
  return newAppointment;
}
export function updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
  const index = mockAppointments.findIndex(a => a.id === id);
  if (index === -1) return null;
  mockAppointments[index] = {
    ...mockAppointments[index],
    ...updates,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  return mockAppointments[index];
}
export function deleteAppointment(id: string): boolean {
  const index = mockAppointments.findIndex(a => a.id === id);
  if (index === -1) return false;
  mockAppointments.splice(index, 1);
  return true;
}

// Helper functions
export function getCandidateById(id: string): Candidate | undefined {
  return mockCandidates.find(c => c.id === id);
}
export function getCarById(id: string): Car | undefined {
  return mockCars.find(c => c.id === id);
}
export function getInstructorById(id: string): Instructor | undefined {
  return mockInstructors.find(i => i.id === id);
}
export function getPackageById(id: string): Package | undefined {
  return mockPackages.find(p => p.id === id);
}
export function getPaymentsByCandidate(candidateId: string): Payment[] {
  return mockPayments.filter(p => p.candidateId === candidateId);
}
export function getAppointmentsByInstructor(instructorId: string): Appointment[] {
  return mockAppointments.filter(a => a.instructorId === instructorId);
}
export function getAppointmentsByCandidate(candidateId: string): Appointment[] {
  return mockAppointments.filter(a => a.candidateId === candidateId);
}
export function getCandidatesByInstructor(instructorId: string): Candidate[] {
  return mockCandidates.filter(c => c.instructorId === instructorId);
}