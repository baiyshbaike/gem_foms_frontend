export interface AuthUser {
  id: number
  username: string
  firstName: string
  lastName: string
  permissions: string[]
}

export interface LoginResponse {
  accessToken: string
  expiresAt: string
  user: AuthUser
}

export interface AuthSession extends LoginResponse {
  activeTenant?: Tenant
}

export interface Tenant {
  id: string
  code: string
  name: string
}

export interface TenantDetails extends Tenant {
  address: string | null
  phone: string
  regionId: number
  regionName: string
  districtId: number
  districtName: string
  isActive: boolean
  createdAt: string
  disabledAt: string | null
}

export type TenantGridRow = TenantDetails

export interface TenantGridQueryRequest {
  page: number
  pageSize: number
  search: string | null
  sorting: PatientGridSort[]
  filters: PatientGridFilter[]
  groupBy: string | null
}

export interface TenantGridExportRequest extends TenantGridQueryRequest {
  selectedIds: string[]
}

export interface TenantGridQueryResult {
  items: TenantGridRow[]
  totalCount: number
  groups: PatientGridGroupSummary[]
}

export interface CreateTenantRequest {
  code: string
  name: string
  address: string | null
  phone: string
  regionId: number
  districtId: number
}

export interface UpdateTenantRequest extends CreateTenantRequest {
  isActive: boolean
}

export interface SwitchTenantResponse {
  accessToken: string
  expiresAt: string
  activeTenant: Tenant
}

export interface AdminRole {
  id: number
  code: string
  name: string
  isSystem: boolean
}

export interface AdminPermission {
  id: number
  code: string
  module: string
  name: string
  description: string | null
}

export interface AdminUserPermission {
  userId: number
  permission: AdminPermission
  createdAt: string
  createdBy: number
}

export interface UpdateUserPermissionsRequest {
  permissionIds: number[]
  reason: string
}

export interface AdminUser {
  id: number
  username: string
  firstName: string
  lastName: string
  isActive: boolean
  failedLoginCount: number
  lockoutEndAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string | null
  role: AdminRole
  managerRegion: {
    id: number
    name: string
  } | null
  tenants: Tenant[]
  permissions: AdminPermission[]
}

export interface CreateAdminUserRequest {
  username: string
  password: string
  firstName: string
  lastName: string
  isActive: boolean
  roleId: number
  managerRegionId: number | null
  tenantIds: string[]
}

export interface UpdateAdminUserRequest {
  username: string
  password: string | null
  firstName: string
  lastName: string
  isActive: boolean
  roleId: number
  managerRegionId: number | null
  tenantIds: string[]
}

export type PatientGender = 1 | 2

export interface Patient {
  id: number
  inn: string
  firstName: string
  lastName: string
  middleName: string
  birthDate: string
  gender: PatientGender
  address: string
  address2: string
  phone: string
  districtId: number
  regionId: number
  groupId: number
  groupCode: string
  groupName: string
  specialStatus: boolean
  specialStatusReasonId: number | null
  specialStatusReasonName: string | null
  createdAt: string
  updatedAt: string | null
  isActive: boolean
}

export interface PatientGridRow extends Patient {
  fullName: string
  regionName: string
  districtName: string
}

export type PatientGridFilterOperator
  = | 'contains'
    | 'notContains'
    | 'startsWith'
    | 'endsWith'
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'between'
    | 'isEmpty'
    | 'isNotEmpty'

export interface PatientGridSort {
  field: string
  descending: boolean
}

export interface PatientGridFilter {
  field: string
  operator: PatientGridFilterOperator
  value: string | null
  valueTo: string | null
}

export interface PatientGridQueryRequest {
  page: number
  pageSize: number
  search: string | null
  sorting: PatientGridSort[]
  filters: PatientGridFilter[]
  groupBy: string | null
}

export interface PatientGridExportRequest extends PatientGridQueryRequest {
  selectedIds: number[]
}

export interface PatientGridGroupSummary {
  key: string
  label: string
  count: number
}

export interface PatientGridQueryResult {
  items: PatientGridRow[]
  totalCount: number
  groups: PatientGridGroupSummary[]
}

export interface PatientGroup {
  id: number
  code: string
  name: string
}

export interface PatientSpecialStatusReason {
  id: number
  code: string
  name: string
  description: string | null
  isActive: boolean
}

export interface CodeMkb {
  id: number
  code: string
  name: string
  ageProperty: string | null
  pol: string | null
  createdAt: string
  isActive: boolean
}

export interface UpsertCodeMkbRequest {
  code: string
  name: string
  ageProperty: string | null
  pol: string | null
  isActive: boolean
}

export interface DialyzerType {
  id: number
  name: string
  createdAt: string
  isActive: boolean
}

export interface UpsertDialyzerTypeRequest {
  name: string
  isActive: boolean
}

export interface EmployeePosition {
  id: number
  name: string
  createdAt: string
  isActive: boolean
}

export interface UpsertEmployeePositionRequest {
  name: string
  isActive: boolean
}

export interface EmployeeTenant {
  id: number
  tenantId: string
  firstName: string
  lastName: string
  middleName: string | null
  fullName: string
  position: string
  phoneNumber: string | null
  createdAt: string
  isActive: boolean
}

export interface UpsertEmployeeTenantRequest {
  tenantId?: string | null
  firstName: string
  lastName: string
  middleName: string | null
  position: string
  phoneNumber: string | null
  isActive: boolean
}

export interface MedicineType {
  id: number
  name: string
  createdAt: string
  isActive: boolean
}

export interface UpsertMedicineTypeRequest {
  name: string
  isActive: boolean
}

export interface BasisProtocol {
  id: number
  name: string
  createdAt: string
  isActive: boolean
}

export interface UpsertBasisProtocolRequest {
  name: string
  isActive: boolean
}

export interface PatientIdentityLookup {
  found: boolean
  firstName: string | null
  lastName: string | null
  middleName: string | null
}

export interface District {
  id: number
  regionId: number
  regionName: string
  name: string
  isActive: boolean
}

export interface Region {
  id: number
  name: string
  isActive: boolean
  districts: District[]
}

export interface CreatePatientRequest {
  inn: string
  firstName: string
  lastName: string
  middleName: string
  birthDate: string
  gender: PatientGender
  address: string
  address2: string
  phone: string
  districtId: number
  regionId: number
}

export interface UpdatePatientRequest {
  firstName: string
  lastName: string
  middleName: string
  address: string
  address2: string
  phone: string
  districtId: number
  regionId: number
  specialStatus: boolean
  specialStatusReasonId: number | null
  isActive: boolean
}

export interface UpsertPatientSpecialStatusReasonRequest {
  code: string
  name: string
  description: string | null
  isActive: boolean
}

export type MedCardStatus = 1 | 2 | 3 | 4

export interface MedCardPatientLookup {
  patientId: number
  lastName: string
  firstName: string
  middleName: string
}

export interface MedCard {
  id: number
  tenantId: string
  patientId: number
  patientName: string
  inn: string
  tenantName: string | null
  openedAt: string
  closedAt: string | null
  status: MedCardStatus
  notes: string | null
}

export interface MedCardGridRow {
  id: number
  tenantId: string
  patientId: number
  patientName: string
  inn: string
  tenantName: string | null
  openedAt: string
  closedAt: string | null
  status: MedCardStatus
  notes: string | null
}

export interface MedCardGridQueryRequest<TFilters = MedCardGridFilter> {
  page: number
  pageSize: number
  search: string | null
  sorting: MedCardGridSort[]
  filters: TFilters[]
  groupBy: string | null
  tenantIds?: string[]
}

export interface MedCardGridExportRequest extends MedCardGridQueryRequest {
  selectedIds: number[]
}

export interface MedCardGridQueryResult {
  items: MedCardGridRow[]
  totalCount: number
  groups: MedCardGridGroupSummary[]
}

export interface MedCardGridSort {
  field: string
  descending: boolean
}

export interface MedCardGridFilter {
  field: string
  operator: string
  value: string | null
  valueTo: string | null
}

export interface MedCardGridGroupSummary {
  key: string
  label: string
  count: number
}

export interface CreateMedCardRequest {
  tenantId?: string | null
  patientId: number
  openedAt?: string | null
  notes?: string | null
}

export interface UpdateMedCardRequest {
  openedAt: string
  closedAt: string | null
  status: MedCardStatus
  notes: string | null
}

export type MachineAcquisitionType = 1 | 2

export interface MedCenterMachine {
  id: number
  tenantId: string
  acquisitionType: MachineAcquisitionType
  inventoryNumber: string
  name: string
  model: string
  serialNumber: string
  manufacturer: string
  manufacturingCountry: string | null
  manufactureYear: number
  certificateHolder: string | null
  certificateHolderCountry: string | null
  certificateNumber: string | null
  certificateCountry: string | null
  certificateIssuedAt: string
  permitName: string | null
  permitNumber: string | null
  permitSeries: string | null
  permitExpiresAt: string
  dailySessionLimit: number
  betweenSessionCooldownMinutes: number
  dailyLimitCooldownMinutes: number
  isApproved: boolean
  isActive: boolean
}

export interface UpsertMedCenterMachineRequest {
  tenantId?: string | null
  acquisitionType: MachineAcquisitionType
  inventoryNumber: string
  name: string
  model: string
  serialNumber: string
  manufacturer: string
  manufacturingCountry: string | null
  manufactureYear: number
  certificateHolder: string | null
  certificateHolderCountry: string | null
  certificateNumber: string | null
  certificateCountry: string | null
  certificateIssuedAt: string
  permitName: string | null
  permitNumber: string | null
  permitSeries: string | null
  permitExpiresAt: string
  dailySessionLimit: number
  betweenSessionCooldownMinutes: number
  dailyLimitCooldownMinutes: number
  isApproved: boolean
  isActive: boolean
}

export interface SessionMeasurementRequest {
  sys: number | null
  dia: number | null
  temp: number | null
  ritm: number | null
  measuredAt: string | null
  note: string | null
}

export type SessionMeasurementPoint = 'Start' | 'Hour1' | 'Hour2' | 'Hour3' | 'Hour4' | 'End'

export interface SessionMeasurement {
  id: number
  point: SessionMeasurementPoint
  sys: number | null
  dia: number | null
  temp: number | null
  ritm: number | null
  measuredAt: string | null
  note: string | null
}

export type MachineAcquisitionTypeDto = 1 | 2

export interface MedCenterMachineGridRow {
  id: number
  tenantId: string
  tenantName: string | null
  acquisitionType: MachineAcquisitionTypeDto
  inventoryNumber: string
  name: string
  model: string
  serialNumber: string
  manufacturer: string
  manufacturingCountry: string | null
  manufactureYear: number
  certificateIssuedAt: string
  permitName: string | null
  permitNumber: string | null
  permitSeries: string | null
  permitExpiresAt: string
  dailySessionLimit: number
  betweenSessionCooldownMinutes: number
  dailyLimitCooldownMinutes: number
  isApproved: boolean
  isActive: boolean
}

export interface MedCenterMachineGridSort {
  field: string
  descending: boolean
}

export interface MedCenterMachineGridFilter {
  field: string
  operator: string
  value: string | null
  valueTo: string | null
}

export interface MedCenterMachineGridQueryRequest {
  page: number
  pageSize: number
  search: string | null
  sorting: MedCenterMachineGridSort[]
  filters: MedCenterMachineGridFilter[]
  groupBy: string | null
  tenantIds?: string[]
}

export interface MedCenterMachineGridGroupSummary {
  key: string
  label: string
  count: number
}

export interface MedCenterMachineGridQueryResult {
  items: MedCenterMachineGridRow[]
  totalCount: number
  groups: MedCenterMachineGridGroupSummary[]
}

export interface MedCenterMachineGridExportRequest extends MedCenterMachineGridQueryRequest {
  selectedIds: number[]
}

export type AccRegStatusFilter = 'All' | 'SentToPay' | 'Paid'

export interface AccRegGridRow {
  id: string
  orderNo: number
  tenantId: string
  tenantName: string
  patientId: number | null
  inn: string
  fullName: string
  sessionCount: number
  totalPrice: number
}

export interface AccRegSummary {
  patientCount: number
  sessionCount: number
  totalPrice: number
}

export interface AccRegGridQueryRequest {
  page: number
  pageSize: number
  search: string | null
  sorting: PatientGridSort[]
  filters: PatientGridFilter[]
  groupBy: string | null
  tenantIds: string[]
  fromDate: string | null
  toDate: string | null
  status: AccRegStatusFilter
}

export interface AccRegGridExportRequest extends AccRegGridQueryRequest {
  selectedIds: string[]
}

export interface AccRegExportPreview {
  organizationName: string
  fromDate: string | null
  toDate: string | null
  baseTariff: number
  totalCount: number
  isPreviewTruncated: boolean
  summary: AccRegSummary
  items: AccRegGridRow[]
}

export interface AccRegGridQueryResult {
  items: AccRegGridRow[]
  totalCount: number
  groups: PatientGridGroupSummary[]
  summary: AccRegSummary
}

export interface HdSession {
  id: number
  tenantId: string
  patientId: number
  medCardId: number
  machineId: number | null
  status: string
  identifiedAt: string
  startedAt: string | null
  finishedAt: string | null
  endIdentifiedAt: string | null
  sentToPayAt: string | null
  paidAt: string | null
  activeMinutes: number | null
  pauseMinutes: number | null
}

export interface SystemSettings {
  id: number
  tundukVerificationEnabled: boolean
  tundukQrExpiresMinutes: number
  specialStatusBypassesTunduk: boolean
  defaultSessionPrice: number
  sessionTimeStart: number
  sessionTimeEnd: number
  identificationStartLimitMinutes: number
  autoFinishActiveMinutes: number
  endIdentificationLimitMinutes: number
  sendToPayLimitMinutes: number
  createdAt: string
  createdBy: number
  updatedAt: string | null
  updatedBy: number | null
}

export interface UpdateSystemSettingsRequest {
  tundukVerificationEnabled: boolean
  tundukQrExpiresMinutes: number
  specialStatusBypassesTunduk: boolean
  defaultSessionPrice: number
  sessionTimeStart: number
  sessionTimeEnd: number
  identificationStartLimitMinutes: number
  autoFinishActiveMinutes: number
  endIdentificationLimitMinutes: number
  sendToPayLimitMinutes: number
}

export interface SessionIdentificationPatientLookupRequest {
  tenantId?: string | null
  inn: string
}

export interface SessionIdentificationPatientLookup {
  tenantId: string
  patientId: number
  medCardId: number
  lastName: string
  firstName: string
  middleName: string
  specialStatus: boolean
  specialStatusReasonName: string | null
  tundukRequired: boolean
  canCreateImmediately: boolean
}

export interface CreateSessionIdentificationRequest {
  tenantId?: string | null
  medCardId: number
}

export interface SessionIdentificationQr {
  requestId: string
  expiresAt: string
  qrPayload: string
  status: string
}

export interface RequestVerificationResponse {
  sessionId: string
  expires: string
  qrPayload: string
}

export interface SessionIdentificationStatus {
  requestId: string
  tenantId: string
  patientId: number
  medCardId: number
  status: string
  expiresAt: string
  confirmedAt: string | null
  consumedAt: string | null
}

export interface CreateSessionRequest {
  tenantId?: string | null
  medCardId: number
  identificationRequestId?: string | null
}

export type SessionProgramDto = 1 | 2 | 3

export const sessionProgramOptions: { value: SessionProgramDto, label: string }[] = [
  { value: 1, label: 'HD' },
  { value: 2, label: 'HDF' },
  { value: 3, label: 'UF' },
]

export interface SessionStartRequest {
  condition: string
  complaints: string
  program: SessionProgramDto
  dialyzerPrimedWithSolution: string
  sodiumCorrection: string
  sodiumReinfusion: string
  vascularAccess: string
  anticoagulation: string
  ultrafiltrationVolume: string
  bloodFlowRate: string
  durationHours: string
  dialyzerTypeId: number
  dialyzerTypeName: string | null
  patientWeight: string
}

export interface SaveSessionBeginningRequest {
  sessionStart: SessionStartRequest
  sessionMeasurement: SessionMeasurementRequest
}

export interface StartSessionRequest {
  machineId: number
}

export interface AdjustSessionStartTimeRequest {
  startedAt: string
}

export interface FinishSessionRequest {
  finishedAt: string | null
}

export interface SessionStartMachineOption {
  id: number
  name: string
  model: string
  serialNumber: string
  isAvailable: boolean
  unavailableReason: string | null
}

export interface PauseSessionRequest {
  reason: string | null
}

export interface SessionEndRequest {
  patientWeight: string
  hypotension: boolean
  hypertension: boolean
  muscleCrampsLimbs: boolean
  heartRhythmDisturbances: boolean
  headaches: boolean
  attacksAnginaPectoris: boolean
  otherComplications: string | null
  complicationCorrection: string | null
  plannedAppointments: string | null
  recommendations: string | null
  effectiveTime: string | null
  description: string | null
  dutyNurseEmployeeTenantId: number
}

export interface SaveSessionEndRequest {
  endSession: SessionEndRequest
  sessionMeasurement: SessionMeasurementRequest
}

export interface AuditLog {
  id: number
  userId: number | null
  usernameSnapshot: string | null
  action: string
  module: string
  succeeded: boolean
  failureReason: string | null
  createdAt: string
}

export interface SessionGridRow {
  id: number
  tenantId: string
  patientId: number
  patientName: string
  patientInn: string
  medCardId: number
  machineId: number | null
  machineName: string | null
  status: string
  identifiedAt: string
  startedAt: string | null
  finishedAt: string | null
  endIdentifiedAt: string | null
  sentToPayAt: string | null
  paidAt: string | null
  archivedAt: string | null
  activeMinutes: number | null
  pauseMinutes: number | null
  filledMeasurementPoints: SessionMeasurementPoint[]
  hasBeginning: boolean
  hasEnd: boolean
}

export interface SessionGridSort {
  field: string
  descending: boolean
}

export interface SessionGridFilter {
  field: string
  operator: string
  value: string | null
  valueTo: string | null
}

export interface SessionGridQueryRequest {
  page: number
  pageSize: number
  search: string | null
  sorting: SessionGridSort[]
  filters: SessionGridFilter[]
  groupBy: string | null
  statuses?: string[]
  tenantIds?: string[]
}

export interface SessionGridExportRequest extends SessionGridQueryRequest {
  selectedIds: number[]
}

export interface SessionGridGroupSummary {
  key: string
  label: string
  count: number
}

export interface SessionGridQueryResult {
  items: SessionGridRow[]
  totalCount: number
  groups: SessionGridGroupSummary[]
}

export interface AdminUserGridRow {
  id: number
  username: string
  firstName: string
  lastName: string
  isActive: boolean
  failedLoginCount: number
  lockoutEndAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string | null
  role: string
  managerRegionName: string | null
  tenants: string
}

export interface AdminUserGridSort {
  field: string
  descending: boolean
}

export interface AdminUserGridFilter {
  field: string
  operator: string
  value: string | null
  valueTo: string | null
}

export interface AdminUserGridQueryRequest {
  page: number
  pageSize: number
  search: string | null
  sorting: AdminUserGridSort[]
  filters: AdminUserGridFilter[]
  groupBy: string | null
}

export interface AdminUserGridExportRequest extends AdminUserGridQueryRequest {
  selectedIds: number[]
}

export interface AdminUserGridGroupSummary {
  key: string
  label: string
  count: number
}

export interface AdminUserGridQueryResult {
  items: AdminUserGridRow[]
  totalCount: number
  groups: AdminUserGridGroupSummary[]
}

export interface AuditLogGridRow {
  id: number
  userId: number | null
  usernameSnapshot: string | null
  action: string
  module: string
  entityName: string | null
  entityId: string | null
  httpMethod: string | null
  path: string | null
  ipAddress: string | null
  statusCode: number | null
  succeeded: boolean
  failureReason: string | null
  correlationId: string | null
  createdAt: string
}

export interface AuditLogGridSort {
  field: string
  descending: boolean
}

export interface AuditLogGridFilter {
  field: string
  operator: string
  value: string | null
  valueTo: string | null
}

export interface AuditLogGridQueryRequest {
  page: number
  pageSize: number
  search: string | null
  sorting: AuditLogGridSort[]
  filters: AuditLogGridFilter[]
  groupBy: string | null
}

export interface AuditLogGridExportRequest extends AuditLogGridQueryRequest {
  selectedIds: number[]
}

export interface AuditLogGridGroupSummary {
  key: string
  label: string
  count: number
}

export interface AuditLogGridQueryResult {
  items: AuditLogGridRow[]
  totalCount: number
  groups: AuditLogGridGroupSummary[]
}

export interface LpuOption {
  id: number
  code: string
  name: string
}

export interface ProtocolPatientLookup {
  id: number
  inn: string
  fullName: string
  groupId: number
  groupName: string
}

export interface CreateProtocolPatientHistory {
  patientId: number
  newStatusId: number
  basisProtocolId: number
  lpuId: number | null
  cause: string | null
}

export interface CreateProtocolEmployee {
  fio: string
  employeePositionId: number
}

export interface CreateProtocolPayload {
  notes: string | null
  patientHistories: CreateProtocolPatientHistory[]
  employees: CreateProtocolEmployee[]
}

export interface ProtocolDocument {
  id: number
  fileName: string
  contentType: string
  extension: string
  fileSizeBytes: number
  createdAt: string
}

export interface ProtocolHistory {
  id: number
  oldStatusId: number
  oldStatusName: string
  newStatusId: number
  newStatusName: string
  basisProtocolId: number
  basisProtocolName: string
  lpuId: number | null
  lpuName: string | null
  cause: string | null
  patient: Patient
  documents: ProtocolDocument[]
  createdAt: string
}

export interface ProtocolEmployee {
  id: number
  fio: string
  employeePositionId: number
  employeePosition: string
}

export interface Protocol {
  id: number
  notes: string | null
  patientHistories: ProtocolHistory[]
  employees: ProtocolEmployee[]
  createdAt: string
  isActive: boolean
}
