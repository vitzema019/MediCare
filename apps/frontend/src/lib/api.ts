/**
 * Backend API Client
 *
 * Utility functions for interacting with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Auth token management
const AUTH_TOKEN_KEY = 'auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// Authenticated fetch helper
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // Handle 401 Unauthorized - clear token and redirect to login
  if (response.status === 401) {
    removeAuthToken();
    localStorage.removeItem('patient_user');
    localStorage.removeItem('doctor_user');
    localStorage.removeItem('currentDoctor');
    // Dispatch event for auth context to handle
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return response;
}

// Types
export interface HealthStatus {
  status: 'ok';
}

export interface CreateReservationDto {
  patientId?: string;
  departmentId: string;
  doctorId: string;
  procedureId: string;
  slotStart: string; // ISO 8601
  slotEnd: string; // ISO 8601
  contactEmail: string;
  note?: string;
  gdprConsent: boolean;
  medicalDataConsent: boolean;
}

export interface Reservation {
  id: string;
  code: string;
  doctorId: string;
  doctorName?: string;
  patientId: string;
  patientName?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  departmentId: string;
  procedureId: string;
  procedureName?: string;
  procedure?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  slotStart: string;
  slotEnd: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'cancellation_requested' | 'reschedule_requested' | 'update_requested';
  createdAt: string;
  updatedAt: string;
  note?: string;
  cancellationRequestMessage?: string;
  rescheduleRequestMessage?: string;
  requestedSlotStart?: string;
  requestedSlotEnd?: string;
  updateRequestMessage?: string;
  requestedDoctorId?: string;
  requestedProcedureId?: string;
  requestedDepartmentId?: string;
}

export interface CreateReservationResponse {
  reservation: Reservation;
  notificationStatus: {
    email: 'sent' | 'failed' | 'notRequested';
  };
}

export interface UpdateReservationDto {
  doctor?: string;
  patient?: string;
  procedure?: string;
  slotStart?: string;
  slotEnd?: string;
  status?: string;
  notes?: string;
}

export interface TimeSlot {
  from: string; // Format: "YYYY-MM-DD HH:mm"
  to: string;   // Format: "YYYY-MM-DD HH:mm"
}

export interface TimeSlotDto {
  from: string; // Format: "YYYY-MM-DDTHH:mm"
  to: string;   // Format: "YYYY-MM-DDTHH:mm"
}

// API Client Functions

/**
 * Health Check
 */
export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

/**
 * Get API welcome message
 */
export async function getApiInfo(): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/`);
  if (!response.ok) {
    throw new Error('Failed to get API info');
  }
  return response.json();
}

/**
 * Create a new reservation
 */
export async function createReservation(
  data: CreateReservationDto
): Promise<CreateReservationResponse> {
  const response = await authFetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create reservation');
  }

  return response.json();
}

/**
 * Update an existing reservation
 */
export async function updateReservation(
  id: string,
  data: UpdateReservationDto
): Promise<Reservation> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update reservation');
  }

  return response.json();
}

/**
 * Delete a reservation
 */
export async function deleteReservation(id: string): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete reservation');
  }
}

/**
 * Get all reservations for a patient
 */
export async function getReservations(patientId?: string): Promise<Reservation[]> {
  const url = patientId
    ? `${API_BASE_URL}/reservations?patientId=${patientId}`
    : `${API_BASE_URL}/reservations`;

  const response = await authFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get reservations');
  }

  return response.json();
}

/**
 * Get available time slots for a doctor
 */
export async function getAvailableTimeSlots(
  doctorId: string,
  options?: {
    from?: string; // Format: "YYYY-MM-DD"
    to?: string;   // Format: "YYYY-MM-DD"
  }
): Promise<TimeSlot[]> {
  const params = new URLSearchParams();
  if (options?.from) params.append('from', options.from);
  if (options?.to) params.append('to', options.to);

  const url = `${API_BASE_URL}/timeslots/${doctorId}${params.toString() ? '?' + params.toString() : ''}`;
  
  // Use cache: 'no-store' instead of query parameter to avoid validation errors
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get time slots');
  }

  return response.json();
}

/**
 * Add a time slot for a doctor
 */
export async function addTimeSlot(
  doctorId: string,
  timeSlot: TimeSlotDto
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/timeslots/${doctorId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(timeSlot),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add time slot');
  }
}

/**
 * Remove a time slot for a doctor
 */
export async function removeTimeSlot(
  doctorId: string,
  timeSlot: TimeSlotDto
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/timeslots/${doctorId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(timeSlot),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove time slot');
  }
}

/**
 * Helper function to format date for time slot API
 */
export function formatDateForTimeSlot(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Helper function to format date for query parameters
 */
export function formatDateForQuery(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Department types
 */
export interface Department {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
}

/**
 * Procedure types
 */
export interface Procedure {
  id: string;
  name: string;
  price: number;
  duration: number;
}

/**
 * Doctor types
 */
export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  enabled: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  active?: boolean;
  availableHours?: DaySchedule[];
  specialty?: string;
  department?: string;
  phoneNumber?: string;
  licenseNumber?: string;
}

export interface CreateDoctorDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginDoctorDto {
  email: string;
  password: string;
}

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  role: UserRole;
}

/**
 * Unified login function using /auth/login endpoint
 */
export async function login(email: string, password: string, role: UserRole): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to login');
  }

  const data: LoginResponse = await response.json();

  // Store the token
  setAuthToken(data.access_token);

  return data;
}

/**
 * Get all departments
 */
export async function getDepartments(): Promise<Department[]> {
  const response = await fetch(`${API_BASE_URL}/departments`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get departments');
  }

  return response.json();
}

/**
 * Get all procedures
 */
export async function getProcedures(): Promise<Procedure[]> {
  const response = await fetch(`${API_BASE_URL}/procedures`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get procedures');
  }

  return response.json();
}

/**
 * Get all active doctors
 */
export async function getDoctors(): Promise<Doctor[]> {
  const response = await fetch(`${API_BASE_URL}/doctors`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get doctors');
  }

  return response.json();
}

/**
 * Get a single doctor by ID
 */
export async function getDoctor(id: string): Promise<Doctor> {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get doctor');
  }

  return response.json();
}

/**
 * Patient types
 */
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
}

export interface LoginPatientDto {
  email: string;
  password: string;
}

function normalizePatient(raw: unknown): Patient {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: typeof data.id === 'string' ? data.id : normalizeId(data._id),
    firstName: typeof data.firstName === 'string' ? data.firstName : '',
    lastName: typeof data.lastName === 'string' ? data.lastName : '',
    email: typeof data.email === 'string' ? data.email : '',
    phoneNumber: typeof data.phoneNumber === 'string' ? data.phoneNumber : undefined,
    address: typeof data.address === 'string' ? data.address : undefined,
  };
}

/**
 * Register a new patient
 */
export async function registerPatient(data: CreatePatientDto): Promise<Patient> {
  const response = await fetch(`${API_BASE_URL}/patients/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to register patient');
  }

  const result = await response.json();
  return {
    id: result._id?.toString() || result.id,
    firstName: result.firstName,
    lastName: result.lastName,
    email: result.email,
    phoneNumber: result.phoneNumber,
    address: result.address,
  };
}

/**
 * Get all patients (doctor/admin only)
 */
export async function getPatients(): Promise<Patient[]> {
  const response = await authFetch(`${API_BASE_URL}/patients`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get patients');
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizePatient) : [];
}

/**
 * Login a patient
 */
export async function loginPatient(data: LoginPatientDto): Promise<Patient> {
  const response = await fetch(`${API_BASE_URL}/patients/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to login');
  }

  return response.json();
}

/**
 * Message types
 */
export interface Message {
  id: string;
  content: string;
  senderType: 'doctor' | 'patient';
  reservationId?: string;
  subject?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateMessageDto {
  content: string;
  senderType: 'doctor' | 'patient';
  reservationId?: string;
  subject?: string;
}

export interface Conversation {
  id?: string;
  patientId?: string;
  doctorId?: string;
  patientName?: string;
  doctorName?: string;
  name?: string;
  unreadCount: number;
  lastMessageTime?: string;
}

/**
 * Get reservations for a doctor
 */
export async function getDoctorReservations(doctorId: string): Promise<Reservation[]> {
  const response = await authFetch(`${API_BASE_URL}/reservations?doctorId=${doctorId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get doctor reservations');
  }

  return response.json();
}

/**
 * Confirm or decline a reservation
 */
export async function confirmReservation(
  reservationId: string,
  status: 'confirmed' | 'cancelled',
  message?: string,
): Promise<{ id: string; status: string; message: string }> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${reservationId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to confirm reservation');
  }

  return response.json();
}

/**
 * Create a message
 */
export async function createMessage(
  data: CreateMessageDto,
  doctorId?: string,
  patientId?: string,
): Promise<Message> {
  const url = new URL(`${API_BASE_URL}/messages`);
  if (doctorId) url.searchParams.append('doctorId', doctorId);
  if (patientId) url.searchParams.append('patientId', patientId);

  const response = await authFetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create message');
  }

  return response.json();
}

/**
 * Get conversation between doctor and patient
 */
export async function getConversation(doctorId: string, patientId: string): Promise<Message[]> {
  const response = await authFetch(
    `${API_BASE_URL}/messages/conversation?doctorId=${doctorId}&patientId=${patientId}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get conversation');
  }

  return response.json();
}

/**
 * Get doctor's conversations
 */
export async function getDoctorConversations(doctorId: string): Promise<Conversation[]> {
  const response = await authFetch(`${API_BASE_URL}/messages/doctor/${doctorId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get conversations');
  }

  return response.json();
}

/**
 * Get patient's conversations
 */
export async function getPatientConversations(patientId: string): Promise<Conversation[]> {
  const response = await authFetch(`${API_BASE_URL}/messages/patient/${patientId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get conversations');
  }

  return response.json();
}

/**
 * Request cancellation of a reservation (patient)
 */
export async function requestCancellation(id: string, message: string): Promise<Reservation> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/request-cancellation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request cancellation');
  }
  return response.json();
}

/**
 * Accept cancellation request (doctor)
 */
export async function acceptCancellation(id: string): Promise<Reservation> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/accept-cancellation`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept cancellation');
  }
  return response.json();
}

/**
 * Decline cancellation request (doctor)
 */
export async function declineCancellation(id: string, message: string): Promise<Reservation> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/decline-cancellation`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to decline cancellation');
  }
  return response.json();
}

/**
 * Request reschedule of a reservation (patient)
 */
export async function requestReschedule(
  id: string,
  message: string,
  requestedSlotStart: string,
  requestedSlotEnd: string
): Promise<Reservation> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/request-reschedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, requestedSlotStart, requestedSlotEnd }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request reschedule');
  }
  return response.json();
}

/**
 * Accept reschedule request (doctor)
 */
export async function acceptReschedule(id: string): Promise<Reservation> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/accept-reschedule`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept reschedule');
  }
  return response.json();
}

/**
 * Decline reschedule request (doctor)
 */
export async function declineReschedule(id: string, message: string): Promise<Reservation> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/decline-reschedule`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to decline reschedule');
  }
  return response.json();
}

/**
 * Request update of a reservation (patient)
 */
export async function requestUpdate(
  id: string,
  message: string,
  requestedSlotStart?: string,
  requestedSlotEnd?: string,
  requestedDoctorId?: string,
  requestedProcedureId?: string,
  requestedDepartmentId?: string
): Promise<Reservation> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/request-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      requestedSlotStart,
      requestedSlotEnd,
      requestedDoctorId,
      requestedProcedureId,
      requestedDepartmentId,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request update');
  }
  return response.json();
}

/**
 * Accept update request (doctor)
 */
export async function acceptUpdate(id: string): Promise<Reservation> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/accept-update`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept update');
  }
  return response.json();
}

/**
 * Decline update request (doctor)
 */
export async function declineUpdate(id: string, message: string): Promise<Reservation> {
  const response = await authFetch(`${API_BASE_URL}/reservations/${id}/decline-update`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to decline update');
  }
  return response.json();
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/messages/${messageId}/read`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark message as read');
  }
}

/**
 * Register a new doctor
 */
export async function registerDoctor(data: CreateDoctorDto): Promise<Doctor> {
  const response = await fetch(`${API_BASE_URL}/doctors/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to register doctor');
  }
  return response.json();
}

/**
 * Login as a doctor
 */
export async function loginDoctor(data: LoginDoctorDto): Promise<Doctor> {
  const response = await fetch(`${API_BASE_URL}/doctors/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to login doctor');
  }
  return response.json();
}

/**
 * Get doctor's available hours
 */
export async function getDoctorAvailableHours(doctorId: string): Promise<{ id: string; availableHours: DaySchedule[] }> {
  const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/available-hours`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get available hours');
  }
  return response.json();
}

/**
 * Update doctor's available hours
 */
export async function updateDoctorAvailableHours(
  doctorId: string,
  availableHours: DaySchedule[]
): Promise<{ id: string; availableHours: DaySchedule[] }> {
  const response = await authFetch(`${API_BASE_URL}/doctors/${doctorId}/available-hours`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ availableHours }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update available hours');
  }
  return response.json();
}

/**
 * Patient Card types and API functions
 */
export interface PatientCard {
  id: string;
  _id?: string;
  doctor: {
    id: string;
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  patient: {
    id: string;
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
  };
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  notes?: string;
  bloodType?: string;
  height?: number;
  weight?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  visitHistory?: Array<{
    date: string;
    procedure: string;
    notes?: string;
    reservationId: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdatePatientCardDto {
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  notes?: string;
  bloodType?: string;
  height?: number;
  weight?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface CreatePatientCardDto {
  doctorId: string;
  patientId: string;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  notes?: string;
  bloodType?: string;
  height?: number;
  weight?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface UpdatePatientDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}

function normalizeId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toString' in value) {
    return (value as { toString: () => string }).toString();
  }
  return '';
}

function normalizePatientCard(raw: unknown): PatientCard {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const doctorValue = data.doctor;
  const patientValue = data.patient;
  const doctor = doctorValue && typeof doctorValue === 'object' ? (doctorValue as Record<string, unknown>) : {};
  const patient = patientValue && typeof patientValue === 'object' ? (patientValue as Record<string, unknown>) : {};

  return {
    id: typeof data.id === 'string' ? data.id : normalizeId(data._id),
    _id: typeof data._id === 'string' ? data._id : undefined,
    doctor: {
      id: typeof doctor.id === 'string' ? doctor.id : normalizeId(doctor._id),
      _id: typeof doctor._id === 'string' ? doctor._id : undefined,
      firstName: typeof doctor.firstName === 'string' ? doctor.firstName : '',
      lastName: typeof doctor.lastName === 'string' ? doctor.lastName : '',
      email: typeof doctor.email === 'string' ? doctor.email : '',
    },
    patient: {
      id: typeof patient.id === 'string' ? patient.id : normalizeId(patient._id),
      _id: typeof patient._id === 'string' ? patient._id : undefined,
      firstName: typeof patient.firstName === 'string' ? patient.firstName : '',
      lastName: typeof patient.lastName === 'string' ? patient.lastName : '',
      email: typeof patient.email === 'string' ? patient.email : '',
      phoneNumber: typeof patient.phoneNumber === 'string' ? patient.phoneNumber : undefined,
      address: typeof patient.address === 'string' ? patient.address : undefined,
    },
    medicalHistory: typeof data.medicalHistory === 'string' ? data.medicalHistory : undefined,
    allergies: typeof data.allergies === 'string' ? data.allergies : undefined,
    currentMedications: typeof data.currentMedications === 'string' ? data.currentMedications : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    bloodType: typeof data.bloodType === 'string' ? data.bloodType : undefined,
    height: typeof data.height === 'number' ? data.height : undefined,
    weight: typeof data.weight === 'number' ? data.weight : undefined,
    emergencyContact:
      data.emergencyContact && typeof data.emergencyContact === 'object'
        ? (data.emergencyContact as PatientCard['emergencyContact'])
        : undefined,
    visitHistory: Array.isArray(data.visitHistory)
      ? (data.visitHistory as PatientCard['visitHistory'])
      : undefined,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
  };
}

/**
 * Get all patient cards for a doctor
 */
export async function getPatientCards(doctorId: string): Promise<PatientCard[]> {
  const response = await authFetch(`${API_BASE_URL}/patient-cards?doctorId=${doctorId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get patient cards');
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizePatientCard) : [];
}

/**
 * Get a patient card by doctor and patient IDs
 */
export async function getPatientCardByDoctorAndPatient(
  doctorId: string,
  patientId: string
): Promise<PatientCard | null> {
  const response = await authFetch(
    `${API_BASE_URL}/patient-cards/by-doctor-patient?doctorId=${doctorId}&patientId=${patientId}`
  );
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to get patient card');
  }
  const data = await response.json();
  return normalizePatientCard(data);
}

/**
 * Get a patient card by ID
 */
export async function getPatientCard(id: string): Promise<PatientCard> {
  const response = await authFetch(`${API_BASE_URL}/patient-cards/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get patient card');
  }
  const data = await response.json();
  return normalizePatientCard(data);
}

/**
 * Update a patient card
 */
export async function updatePatientCard(
  id: string,
  data: UpdatePatientCardDto
): Promise<PatientCard> {
  const response = await authFetch(`${API_BASE_URL}/patient-cards/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update patient card');
  }
  const updated = await response.json();
  return normalizePatientCard(updated);
}

/**
 * Create a patient card
 */
export async function createPatientCard(
  data: CreatePatientCardDto
): Promise<PatientCard> {
  const response = await authFetch(`${API_BASE_URL}/patient-cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create patient card');
  }
  const created = await response.json();
  return normalizePatientCard(created);
}

/**
 * Update a patient
 */
export async function updatePatient(
  id: string,
  data: UpdatePatientDto
): Promise<Patient> {
  const response = await authFetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update patient');
  }
  const updated = await response.json();
  return normalizePatient(updated);
}

/**
 * Clinic Management types and API functions
 */
export interface ClinicDoctor {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  specialty?: string;
  department?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  availableHours?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>;
}

export interface ClinicStatistics {
  totalDoctors: number;
  activeDoctors: number;
  inactiveDoctors: number;
  totalSpecialties: number;
  totalDepartments: number;
  specialties: string[];
}

export interface UpdateDoctorDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  specialty?: string;
  department?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  active?: boolean;
}

export interface AssignSpecialtyDto {
  specialty?: string;
  department?: string;
}

/**
 * Get all doctors for clinic management
 */
export async function getClinicDoctors(): Promise<ClinicDoctor[]> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/doctors`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get doctors');
  }
  return response.json();
}

/**
 * Get doctors grouped by specialty
 */
export async function getDoctorsBySpecialty(): Promise<Record<string, ClinicDoctor[]>> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/doctors/by-specialty`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get doctors by specialty');
  }
  return response.json();
}

/**
 * Get doctors grouped by department
 */
export async function getDoctorsByDepartment(): Promise<Record<string, ClinicDoctor[]>> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/doctors/by-department`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get doctors by department');
  }
  return response.json();
}

/**
 * Get all specialties
 */
export async function getSpecialties(): Promise<string[]> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/specialties`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get specialties');
  }
  return response.json();
}

/**
 * Get clinic statistics
 */
export async function getClinicStatistics(): Promise<ClinicStatistics> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/statistics`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get clinic statistics');
  }
  return response.json();
}

/**
 * Create a new doctor
 */
export async function createClinicDoctor(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  specialty?: string;
  department?: string;
}): Promise<ClinicDoctor> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/doctors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create doctor');
  }
  return response.json();
}

/**
 * Update a doctor
 */
export async function updateClinicDoctor(id: string, data: UpdateDoctorDto): Promise<ClinicDoctor> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/doctors/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update doctor');
  }
  return response.json();
}

/**
 * Assign specialty/department to a doctor
 */
export async function assignSpecialty(id: string, data: AssignSpecialtyDto): Promise<ClinicDoctor> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/doctors/${id}/assign-specialty`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to assign specialty');
  }
  return response.json();
}

/**
 * Toggle doctor active status
 */
export async function toggleDoctorStatus(id: string): Promise<ClinicDoctor> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/doctors/${id}/toggle-status`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to toggle doctor status');
  }
  return response.json();
}

/**
 * Delete a doctor
 */
export async function deleteClinicDoctor(id: string): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/doctors/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete doctor');
  }
}

/**
 * Team Management types and API functions
 */
export interface Team {
  id: string;
  _id: string;
  name: string;
  description?: string;
  department?: string;
  scope?: string;
  doctors: ClinicDoctor[];
  color?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  department?: string;
  scope?: string;
  doctorIds?: string[];
  color?: string;
  active?: boolean;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  department?: string;
  scope?: string;
  doctorIds?: string[];
  color?: string;
  active?: boolean;
}

/**
 * Get all teams
 */
export async function getTeams(): Promise<Team[]> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/teams`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get teams');
  }
  return response.json();
}

/**
 * Get a team by ID
 */
export async function getTeamById(id: string): Promise<Team> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/teams/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get team');
  }
  return response.json();
}

/**
 * Create a new team
 */
export async function createTeam(data: CreateTeamDto): Promise<Team> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create team');
  }
  return response.json();
}

/**
 * Update a team
 */
export async function updateTeam(id: string, data: UpdateTeamDto): Promise<Team> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/teams/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update team');
  }
  return response.json();
}

/**
 * Delete a team
 */
export async function deleteTeam(id: string): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/teams/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete team');
  }
}

/**
 * Add doctors to a team
 */
export async function addDoctorsToTeam(teamId: string, doctorIds: string[]): Promise<Team> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/teams/${teamId}/doctors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ doctorIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add doctors to team');
  }
  return response.json();
}

/**
 * Remove doctors from a team
 */
export async function removeDoctorsFromTeam(teamId: string, doctorIds: string[]): Promise<Team> {
  const response = await authFetch(`${API_BASE_URL}/clinic-management/teams/${teamId}/doctors`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ doctorIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove doctors from team');
  }
  return response.json();
}
