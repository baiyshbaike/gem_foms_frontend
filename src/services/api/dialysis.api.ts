import type {
  ServerDataGridQueryRequest,
  ServerDataGridQueryResult,
} from '@/components/server-data-grid'

import { apiClient, unwrapData } from '@/services/http'

import type {
  AccRegExportPreview,
  AccRegGridExportRequest,
  AccRegGridQueryRequest,
  AccRegGridQueryResult,
  AdjustSessionStartTimeRequest,
  AdminPermission,
  AdminRole,
  AdminUser,
  AdminUserGridExportRequest,
  AdminUserGridQueryRequest,
  AdminUserGridQueryResult,
  AdminUserPermission,
  AuditLog,
  AuditLogGridExportRequest,
  AuditLogGridQueryRequest,
  AuditLogGridQueryResult,
  AuthUser,
  BasisProtocol,
  CodeMkb,
  CreateAdminUserRequest,
  CreateMedCardRequest,
  CreatePatientRequest,
  CreateProtocolPayload,
  CreateSessionIdentificationRequest,
  CreateSessionRequest,
  CreateTenantRequest,
  DialyzerType,
  EmployeePosition,
  EmployeeTenant,
  FinishSessionRequest,
  HdSession,
  LoginResponse,
  LpuOption,
  MedCard,
  MedCardGridExportRequest,
  MedCardGridQueryRequest,
  MedCardGridQueryResult,
  MedCardPatientLookup,
  MedCenterMachine,
  MedCenterMachineGridExportRequest,
  MedCenterMachineGridQueryRequest,
  MedCenterMachineGridQueryResult,
  MedicineType,
  Patient,
  PatientGridExportRequest,
  PatientGridQueryRequest,
  PatientGridQueryResult,
  PatientGroup,
  PatientIdentityLookup,
  PatientSpecialStatusReason,
  PauseSessionRequest,
  Protocol,
  ProtocolPatientLookup,
  Region,
  RequestVerificationResponse,
  SaveSessionBeginningRequest,
  SaveSessionEndRequest,
  SessionGridExportRequest,
  SessionGridQueryRequest,
  SessionGridQueryResult,
  SessionIdentificationPatientLookup,
  SessionIdentificationPatientLookupRequest,
  SessionIdentificationStatus,
  SessionMeasurement,
  SessionMeasurementPoint,
  SessionMeasurementRequest,
  SessionStartMachineOption,
  StartSessionRequest,
  SwitchTenantResponse,
  SystemSettings,
  Tenant,
  TenantDetails,
  TenantGridExportRequest,
  TenantGridQueryRequest,
  TenantGridQueryResult,
  UpdateAdminUserRequest,
  UpdateMedCardRequest,
  UpdatePatientRequest,
  UpdateSystemSettingsRequest,
  UpdateTenantRequest,
  UpdateUserPermissionsRequest,
  UpsertBasisProtocolRequest,
  UpsertCodeMkbRequest,
  UpsertDialyzerTypeRequest,
  UpsertEmployeePositionRequest,
  UpsertEmployeeTenantRequest,
  UpsertMedCenterMachineRequest,
  UpsertMedicineTypeRequest,
  UpsertPatientSpecialStatusReasonRequest,
} from '../types/dialysis'

export const authApi = {
  login: (username: string, password: string) =>
    unwrapData(apiClient.post<LoginResponse>('/auth/login', { username, password })),

  refresh: () =>
    unwrapData(apiClient.post<LoginResponse>('/auth/refresh', {}, { withCredentials: true })),

  me: () =>
    unwrapData(apiClient.get<AuthUser>('/auth/me')),

  logout: () =>
    apiClient.post('/auth/logout', {}, { withCredentials: true }),
}

export const tenantApi = {
  my: () =>
    unwrapData(apiClient.get<Tenant[]>('/tenants/my')),

  switch: (tenantId: string) =>
    unwrapData(apiClient.post<SwitchTenantResponse>(`/tenants/${tenantId}/switch`)),

  get: (tenantId: string) =>
    unwrapData(apiClient.get<TenantDetails>(`/tenants/${tenantId}`)),

  create: (payload: CreateTenantRequest) =>
    unwrapData(apiClient.post<TenantDetails>('/tenants', payload)),

  update: (tenantId: string, payload: UpdateTenantRequest) =>
    unwrapData(apiClient.put<TenantDetails>(`/tenants/${tenantId}`, payload)),

  deactivate: (tenantId: string) =>
    apiClient.delete(`/tenants/${tenantId}`).then(() => undefined),

  gridQuery: (payload: TenantGridQueryRequest) =>
    unwrapData(apiClient.post<TenantGridQueryResult>('/tenants/grid/query', payload)),

  gridExport: (payload: TenantGridExportRequest) =>
    unwrapData(apiClient.post<TenantGridQueryResult>('/tenants/grid/export', payload)),
}

export const adminUserApi = {
  list: () =>
    unwrapData(apiClient.get<AdminUser[]>('/admin/users')),

  get: (id: number) =>
    unwrapData(apiClient.get<AdminUser>(`/admin/users/${id}`)),

  roles: () =>
    unwrapData(apiClient.get<AdminRole[]>('/admin/users/roles')),

  permissions: () =>
    unwrapData(apiClient.get<AdminPermission[]>('/admin/users/permissions')),

  tenants: () =>
    unwrapData(apiClient.get<Tenant[]>('/admin/users/tenants')),

  create: (payload: CreateAdminUserRequest) =>
    unwrapData(apiClient.post<AdminUser>('/admin/users', payload)),

  update: (id: number, payload: UpdateAdminUserRequest) =>
    unwrapData(apiClient.put<AdminUser>(`/admin/users/${id}`, payload)),

  deactivate: (id: number) =>
    apiClient.delete(`/admin/users/${id}`).then(() => undefined),

  userPermissions: (id: number) =>
    unwrapData(apiClient.get<AdminUserPermission[]>(`/admin/users/${id}/permissions`)),

  updateUserPermissions: (id: number, payload: UpdateUserPermissionsRequest) =>
    unwrapData(apiClient.put<AdminUserPermission[]>(`/admin/users/${id}/permissions`, payload)),

  resetUserPermissionsFromRole: (id: number) =>
    unwrapData(apiClient.post<AdminUserPermission[]>(`/admin/users/${id}/permissions/reset-from-role`)),

  gridQuery: (payload: AdminUserGridQueryRequest) =>
    unwrapData(apiClient.post<AdminUserGridQueryResult>('/admin/users/grid/query', payload)),

  gridExport: (payload: AdminUserGridExportRequest) =>
    unwrapData(apiClient.post<AdminUserGridQueryResult>('/admin/users/grid/export', payload)),
}

export const settingsApi = {
  getSystem: () =>
    unwrapData(apiClient.get<SystemSettings>('/settings/system')),

  updateSystem: (payload: UpdateSystemSettingsRequest) =>
    unwrapData(apiClient.put<SystemSettings>('/settings/system', payload)),
}

export const patientApi = {
  list: (params?: { search?: string, groupId?: number | null }) =>
    unwrapData(apiClient.get<Patient[]>('/patients', { params })),

  get: (id: number) =>
    unwrapData(apiClient.get<Patient>(`/patients/${id}`)),

  getByInn: (inn: string) =>
    unwrapData(apiClient.get<Patient>(`/patients/by-inn/${inn}`)),

  lookupIdentity: (inn: string) =>
    unwrapData(apiClient.get<PatientIdentityLookup>(`/patients/identity-lookup/${encodeURIComponent(inn)}`)),

  create: (payload: CreatePatientRequest) =>
    unwrapData(apiClient.post<Patient>('/patients', payload)),

  update: (id: number, payload: UpdatePatientRequest) =>
    unwrapData(apiClient.put<Patient>(`/patients/${id}`, payload)),

  delete: (id: number) =>
    apiClient.delete(`/patients/${id}`).then(() => undefined),

  gridQuery: (payload: PatientGridQueryRequest) =>
    unwrapData(apiClient.post<PatientGridQueryResult>('/patients/grid/query', payload)),

  gridExport: (payload: PatientGridExportRequest) =>
    unwrapData(apiClient.post<PatientGridQueryResult>('/patients/grid/export', payload)),

  groups: () =>
    unwrapData(apiClient.get<PatientGroup[]>('/patients/groups')),
}

export const patientSpecialStatusReasonApi = {
  list: (includeInactive = false) =>
    unwrapData(apiClient.get<PatientSpecialStatusReason[]>('/patient-special-status-reasons', { params: { includeInactive } })),

  create: (payload: UpsertPatientSpecialStatusReasonRequest) =>
    unwrapData(apiClient.post<PatientSpecialStatusReason>('/patient-special-status-reasons', payload)),

  update: (id: number, payload: UpsertPatientSpecialStatusReasonRequest) =>
    unwrapData(apiClient.put<PatientSpecialStatusReason>(`/patient-special-status-reasons/${id}`, payload)),

  deactivate: (id: number) =>
    apiClient.delete(`/patient-special-status-reasons/${id}`).then(() => undefined),
}

export const codeMkbApi = {
  list: (includeInactive = false) =>
    unwrapData(apiClient.get<CodeMkb[]>('/code-mkbs', { params: { includeInactive } })),

  create: (payload: UpsertCodeMkbRequest) =>
    unwrapData(apiClient.post<CodeMkb>('/code-mkbs', payload)),

  update: (id: number, payload: UpsertCodeMkbRequest) =>
    unwrapData(apiClient.put<CodeMkb>(`/code-mkbs/${id}`, payload)),

  deactivate: (id: number) =>
    apiClient.delete(`/code-mkbs/${id}`).then(() => undefined),

  gridQuery: (payload: ServerDataGridQueryRequest) =>
    unwrapData(apiClient.post<ServerDataGridQueryResult<CodeMkb>>('/code-mkbs/grid/query', payload)),
}

export const dialyzerTypeApi = {
  list: (includeInactive = false) =>
    unwrapData(apiClient.get<DialyzerType[]>('/dialyzer-types', { params: { includeInactive } })),

  create: (payload: UpsertDialyzerTypeRequest) =>
    unwrapData(apiClient.post<DialyzerType>('/dialyzer-types', payload)),

  update: (id: number, payload: UpsertDialyzerTypeRequest) =>
    unwrapData(apiClient.put<DialyzerType>(`/dialyzer-types/${id}`, payload)),

  deactivate: (id: number) =>
    apiClient.delete(`/dialyzer-types/${id}`).then(() => undefined),

  gridQuery: (payload: ServerDataGridQueryRequest) =>
    unwrapData(apiClient.post<ServerDataGridQueryResult<DialyzerType>>('/dialyzer-types/grid/query', payload)),
}

export const employeePositionApi = {
  list: (includeInactive = false) =>
    unwrapData(apiClient.get<EmployeePosition[]>('/employee-positions', { params: { includeInactive } })),

  create: (payload: UpsertEmployeePositionRequest) =>
    unwrapData(apiClient.post<EmployeePosition>('/employee-positions', payload)),

  update: (id: number, payload: UpsertEmployeePositionRequest) =>
    unwrapData(apiClient.put<EmployeePosition>(`/employee-positions/${id}`, payload)),

  deactivate: (id: number) =>
    apiClient.delete(`/employee-positions/${id}`).then(() => undefined),

  gridQuery: (payload: ServerDataGridQueryRequest) =>
    unwrapData(apiClient.post<ServerDataGridQueryResult<EmployeePosition>>('/employee-positions/grid/query', payload)),
}

export const employeeTenantApi = {
  list: (includeInactive = false, tenantIds?: string[]) =>
    unwrapData(apiClient.get<EmployeeTenant[]>('/employee-tenants', { params: { includeInactive, tenantIds } })),

  create: (payload: UpsertEmployeeTenantRequest) =>
    unwrapData(apiClient.post<EmployeeTenant>('/employee-tenants', payload)),

  update: (id: number, payload: UpsertEmployeeTenantRequest) =>
    unwrapData(apiClient.put<EmployeeTenant>(`/employee-tenants/${id}`, payload)),

  deactivate: (id: number) =>
    apiClient.delete(`/employee-tenants/${id}`).then(() => undefined),
}

export const medicineTypeApi = {
  list: (includeInactive = false) =>
    unwrapData(apiClient.get<MedicineType[]>('/medicine-types', { params: { includeInactive } })),

  create: (payload: UpsertMedicineTypeRequest) =>
    unwrapData(apiClient.post<MedicineType>('/medicine-types', payload)),

  update: (id: number, payload: UpsertMedicineTypeRequest) =>
    unwrapData(apiClient.put<MedicineType>(`/medicine-types/${id}`, payload)),

  deactivate: (id: number) =>
    apiClient.delete(`/medicine-types/${id}`).then(() => undefined),

  gridQuery: (payload: ServerDataGridQueryRequest) =>
    unwrapData(apiClient.post<ServerDataGridQueryResult<MedicineType>>('/medicine-types/grid/query', payload)),
}

export const basisProtocolApi = {
  list: (includeInactive = false) =>
    unwrapData(apiClient.get<BasisProtocol[]>('/basis-protocols', { params: { includeInactive } })),

  create: (payload: UpsertBasisProtocolRequest) =>
    unwrapData(apiClient.post<BasisProtocol>('/basis-protocols', payload)),

  update: (id: number, payload: UpsertBasisProtocolRequest) =>
    unwrapData(apiClient.put<BasisProtocol>(`/basis-protocols/${id}`, payload)),

  deactivate: (id: number) =>
    apiClient.delete(`/basis-protocols/${id}`).then(() => undefined),

  gridQuery: (payload: ServerDataGridQueryRequest) =>
    unwrapData(apiClient.post<ServerDataGridQueryResult<BasisProtocol>>('/basis-protocols/grid/query', payload)),
}

export const regionApi = {
  list: (includeInactive = false) =>
    unwrapData(apiClient.get<Region[]>('/regions', { params: { includeInactive } })),
}

export const medCardApi = {
  list: (tenantIds?: string[]) =>
    unwrapData(apiClient.get<MedCard[]>('/med-cards', { params: { tenantIds } })),

  lookupPatient: (inn: string, tenantId?: string | null) =>
    unwrapData(apiClient.get<MedCardPatientLookup>(
      `/med-cards/patient-lookup/${encodeURIComponent(inn)}`,
      { params: { tenantId: tenantId || undefined } },
    )),

  get: (id: number) =>
    unwrapData(apiClient.get<MedCard>(`/med-cards/${id}`)),

  create: (payload: CreateMedCardRequest) =>
    unwrapData(apiClient.post<MedCard>('/med-cards', payload)),

  update: (id: number, payload: UpdateMedCardRequest) =>
    unwrapData(apiClient.put<MedCard>(`/med-cards/${id}`, payload)),

  delete: (id: number) =>
    apiClient.delete(`/med-cards/${id}`).then(() => undefined),

  gridQuery: (request: MedCardGridQueryRequest) =>
    unwrapData(apiClient.post<MedCardGridQueryResult>('/med-cards/grid/query', request)),

  gridExport: (request: MedCardGridExportRequest) =>
    unwrapData(apiClient.post<MedCardGridQueryResult>('/med-cards/grid/export', request)),
}

export const machineApi = {
  list: (tenantIds?: string[]) =>
    unwrapData(apiClient.get<MedCenterMachine[]>('/med-center-machines', { params: { tenantIds } })),

  get: (id: number) =>
    unwrapData(apiClient.get<MedCenterMachine>(`/med-center-machines/${id}`)),

  create: (payload: UpsertMedCenterMachineRequest) =>
    unwrapData(apiClient.post<MedCenterMachine>('/med-center-machines', payload)),

  update: (id: number, payload: UpsertMedCenterMachineRequest) =>
    unwrapData(apiClient.put<MedCenterMachine>(`/med-center-machines/${id}`, payload)),

  delete: (id: number) =>
    apiClient.delete(`/med-center-machines/${id}`).then(() => undefined),

  gridQuery: (request: MedCenterMachineGridQueryRequest) =>
    unwrapData(apiClient.post<MedCenterMachineGridQueryResult>('/med-center-machines/grid/query', request)),

  gridExport: (request: MedCenterMachineGridExportRequest) =>
    unwrapData(apiClient.post<MedCenterMachineGridQueryResult>('/med-center-machines/grid/export', request)),
}

export const accregApi = {
  gridQuery: (request: AccRegGridQueryRequest) =>
    unwrapData(apiClient.post<AccRegGridQueryResult>('/accregs/grid/query', request)),

  exportPreview: (request: AccRegGridExportRequest) =>
    unwrapData(apiClient.post<AccRegExportPreview>('/accregs/export/preview', request)),

  exportExcel: (request: AccRegGridExportRequest) =>
    apiClient.post<Blob>('/accregs/export/excel', request, { responseType: 'blob' }).then(response => response.data),

  exportWord: (request: AccRegGridExportRequest) =>
    apiClient.post<Blob>('/accregs/export/word', request, { responseType: 'blob' }).then(response => response.data),
}

export const sessionIdentificationApi = {
  lookupPatient: (payload: SessionIdentificationPatientLookupRequest) =>
    unwrapData(apiClient.post<SessionIdentificationPatientLookup>(
      '/session-identifications/patient-lookup',
      payload,
    )),

  getStatus: (requestId: string) =>
    unwrapData(apiClient.get<SessionIdentificationStatus>(
      `/session-identifications/${encodeURIComponent(requestId)}`,
    )),
}

export const tundukVerificationApi = {
  request: (payload: CreateSessionIdentificationRequest) =>
    unwrapData(apiClient.post<RequestVerificationResponse>('/tunduk/request', payload)),
}

export const sessionApi = {
  list: (tenantIds?: string[]) =>
    unwrapData(apiClient.get<HdSession[]>('/sessions', { params: { tenantIds } })),

  get: (id: number) =>
    unwrapData(apiClient.get<HdSession>(`/sessions/${id}`)),

  create: (payload: CreateSessionRequest) =>
    unwrapData(apiClient.post<HdSession>('/sessions', payload)),

  startMachineOptions: (id: number) =>
    unwrapData(apiClient.get<SessionStartMachineOption[]>(`/sessions/${id}/start-machine-options`)),

  start: (id: number, payload: StartSessionRequest) =>
    unwrapData(apiClient.put<HdSession>(`/sessions/${id}/start`, payload)),

  adjustStartTime: (id: number, payload: AdjustSessionStartTimeRequest) =>
    unwrapData(apiClient.put<HdSession>(`/sessions/${id}/start-time`, payload)),

  saveBeginning: (id: number, payload: SaveSessionBeginningRequest) =>
    unwrapData(apiClient.put<SessionMeasurement>(`/sessions/${id}/beginning`, payload)),

  getBeginning: (id: number) =>
    unwrapData(apiClient.get<SaveSessionBeginningRequest>(`/sessions/${id}/beginning`)),

  pause: (id: number, payload: PauseSessionRequest) =>
    unwrapData(apiClient.put<HdSession>(`/sessions/${id}/pause`, payload)),

  resume: (id: number) =>
    unwrapData(apiClient.put<HdSession>(`/sessions/${id}/resume`)),

  finish: (id: number, payload: FinishSessionRequest) =>
    unwrapData(apiClient.put<HdSession>(`/sessions/${id}/finish`, payload)),

  endIdentify: (id: number) =>
    unwrapData(apiClient.put<HdSession>(`/sessions/${id}/end-identify`)),

  sendToPay: (id: number) =>
    unwrapData(apiClient.put<HdSession>(`/sessions/${id}/send-to-pay`)),

  markPaid: (id: number) =>
    unwrapData(apiClient.put<HdSession>(`/sessions/${id}/mark-paid`)),

  bulkMarkPaid: (sessionIds: number[]) =>
    unwrapData(apiClient.post<{ updatedCount: number }>('/sessions/mark-paid', { sessionIds })),

  archive: (id: number) =>
    unwrapData(apiClient.put<HdSession>(`/sessions/${id}/archive`)),

  saveEnd: (id: number, payload: SaveSessionEndRequest) =>
    unwrapData(apiClient.put<SessionMeasurement>(`/sessions/${id}/end`, payload)),

  measurement: (id: number, point: SessionMeasurementPoint, payload: SessionMeasurementRequest) =>
    unwrapData(apiClient.put<SessionMeasurement>(`/sessions/${id}/measurements/${point}`, payload)),

  getMeasurement: (id: number, point: SessionMeasurementPoint) =>
    unwrapData(apiClient.get<SessionMeasurement>(`/sessions/${id}/measurements/${point}`)),

  gridQuery: (payload: SessionGridQueryRequest) =>
    unwrapData(apiClient.post<SessionGridQueryResult>('/sessions/grid/query', payload)),

  gridExport: (payload: SessionGridExportRequest) =>
    unwrapData(apiClient.post<SessionGridQueryResult>('/sessions/grid/export', payload)),
}

export const auditApi = {
  latest: () =>
    unwrapData(apiClient.get<AuditLog[]>('/admin/audit-logs')),

  gridQuery: (payload: AuditLogGridQueryRequest) =>
    unwrapData(apiClient.post<AuditLogGridQueryResult>('/admin/audit-logs/grid/query', payload)),

  gridExport: (payload: AuditLogGridExportRequest) =>
    unwrapData(apiClient.post<AuditLogGridQueryResult>('/admin/audit-logs/grid/export', payload)),
}

export const protocolApi = {
  list: (includeInactive = false) =>
    unwrapData(apiClient.get<Protocol[]>('/protocols', { params: { includeInactive } })),

  get: (id: number) =>
    unwrapData(apiClient.get<Protocol>(`/protocols/${id}`)),

  searchPatients: (groupId: number, inn: string, take = 20, excludePatientIds?: number[]) =>
    unwrapData(apiClient.get<ProtocolPatientLookup[]>('/protocols/patients', {
      params: {
        groupId,
        inn,
        take,
        excludePatientIds: excludePatientIds?.length ? excludePatientIds.join(',') : undefined,
      },
    })),

  lpus: () =>
    unwrapData(apiClient.get<LpuOption[]>('/protocols/lpus')),

  create: (payload: CreateProtocolPayload, filesByHistoryIndex: Map<number, File[]>) => {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(payload))

    for (const [historyIndex, files] of filesByHistoryIndex.entries()) {
      for (const file of files) {
        formData.append(`historyFiles[${historyIndex}]`, file)
      }
    }

    return unwrapData(apiClient.post<Protocol>('/protocols', formData))
  },
}
