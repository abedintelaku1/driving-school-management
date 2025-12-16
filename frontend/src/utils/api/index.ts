import { authApi } from './auth';
import { candidatesApi } from './candidates';
import { instructorsApi } from './instructors';


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


};

// Export individual APIs for direct use if needed
export { authApi, candidatesApi, instructorsApi};

// Export types
export type { ApiResponse } from './config';

