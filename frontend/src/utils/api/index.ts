import { authApi } from './auth';
import { candidatesApi } from './candidates';
import { instructorsApi } from './instructors';
import { carsApi } from './cars';
import { packagesApi } from './packages';
import { notificationsApi } from './notifications';
import { exportApi } from './export';


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
  getLicenseCategories: packagesApi.getLicenseCategories,

  // Notifications
  getNotifications: notificationsApi.getAll,
  getUnreadCount: notificationsApi.getUnreadCount,
  markNotificationAsRead: notificationsApi.markAsRead,
  markAllNotificationsAsRead: notificationsApi.markAllAsRead,
  deleteNotification: notificationsApi.delete,

};

// Add export functions using Object.assign to ensure they're properly bound
Object.assign(api, {
  exportCandidateReport: exportApi.exportCandidateReport,
  exportInstructorReport: exportApi.exportInstructorReport,
});

// Debug: Verify export functions are available (only in development)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('Export API loaded:', {
    hasExportCandidateReport: typeof exportApi.exportCandidateReport === 'function',
    hasExportInstructorReport: typeof exportApi.exportInstructorReport === 'function',
    exportApiKeys: Object.keys(exportApi),
    apiHasExportCandidateReport: typeof api.exportCandidateReport === 'function',
    apiHasExportInstructorReport: typeof api.exportInstructorReport === 'function',
    apiKeys: Object.keys(api)
  });
}

// Export individual APIs for direct use if needed
export { authApi, candidatesApi, instructorsApi, carsApi, packagesApi, notificationsApi, exportApi };

// Export types
export type { ApiResponse } from './config';

