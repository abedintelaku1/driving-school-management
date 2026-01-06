import { authApi } from './auth';
import { candidatesApi } from './candidates';
import { instructorsApi } from './instructors';
import { carsApi } from './cars';
import { packagesApi } from './packages';
import { notificationsApi } from './notifications';


// Main API object that exports all API modules
export const api = {
  // Auth
  login: authApi.login,
  me: authApi.me,
  clearToken: authApi.clearToken,

  // Candidates
  listCandidates: candidatesApi.list,
  getCandidate: candidatesApi.get,
  createCandidate: candidatesApi.create,
  updateCandidate: candidatesApi.update,
  deleteCandidate: candidatesApi.delete,

  // Instructors
  listInstructors: instructorsApi.list,
  getInstructor: instructorsApi.get,
  getInstructorMe: instructorsApi.getMe,
  createInstructor: instructorsApi.create,
  updateInstructor: instructorsApi.update,
  deleteInstructor: instructorsApi.delete,

  // Cars
  listCars: carsApi.list,
  getCar: carsApi.get,
  createCar: carsApi.create,
  updateCar: carsApi.update,
  deleteCar: carsApi.delete,

  // Packages
  listPackages: packagesApi.list,
  getPackage: packagesApi.get,
  createPackage: packagesApi.create,
  updatePackage: packagesApi.update,
  deletePackage: packagesApi.delete,

  // Notifications
  getNotifications: notificationsApi.getAll,
  getUnreadCount: notificationsApi.getUnreadCount,
  markNotificationAsRead: notificationsApi.markAsRead,
  markAllNotificationsAsRead: notificationsApi.markAllAsRead,
  deleteNotification: notificationsApi.delete,

};

// Export individual APIs for direct use if needed
export { authApi, candidatesApi, instructorsApi, carsApi, packagesApi, notificationsApi };

// Export types
export type { ApiResponse } from './config';

