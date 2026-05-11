// ─── Enums / Union types ─────────────────────────────────────────────────────

export type UserRole =
  | 'MIS_MANAGER'
  | 'ACCOUNT_MANAGER'
  | 'COE_LAB_HEAD'
  | 'HEAD_OF_ENGINEERING'
  | 'COE_COORDINATOR';

export type MandateStatus = 'draft' | 'active' | 'closed';
export type RequirementStatus = 'draft' | 'active' | 'fulfilled' | 'cancelled';

export type CandidateStatus =
  | 'Selected'
  | 'Proposed'
  | 'Mapped'
  | 'Discussed'
  | 'LOI Sent'
  | 'LOI Signed'
  | 'CFP Started'
  | 'Dropped';

export type MappingStatus =
  | 'Draft'
  | 'Submitted'
  | 'Engineering Review'
  | 'Approved by Eng'
  | 'Confirmed by MIS'
  | 'In Discussion'
  | 'LOI Issued'
  | 'Signed'
  | 'CFP Started';

export type DiscussionOutcome =
  | 'Interested'
  | 'Not Interested'
  | 'Need Time'
  | 'Unreachable';

export type LOIStatus = 'Sent' | 'Signed' | 'Acknowledged' | 'Pending';

export type ApprovalDecision = 'Approved' | 'Rejected' | 'Pending';

export type DriveStatus = 'planned' | 'completed' | 'cancelled';

export type NotificationType =
  | 'MAPPING_SUBMITTED'
  | 'ENGINEERING_APPROVED'
  | 'ENGINEERING_REJECTED'
  | 'MAPPING_CONFIRMED'
  | 'LOI_SIGNED'
  | 'DISCUSSION_DUE'
  | 'CFP_STARTED';

// ─── Core entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  coeScopeIds: string[];
  avatar: string;
}

export interface COE {
  id: string;
  name: string;
  location: string;
  spoc: string;
  studentsCount: number;
}

export interface Client {
  id: string;
  name: string;
  tags: string[];
  accountOwner: string;
  shortCode: string;
}

export interface Mandate {
  id: string;
  clientId: string;
  mandateName: string;
  mandateType: string;
  contractRef: string;
  startDate: string;
  onboardingDate: string;
  locations: string[];
  notes: string;
  status: MandateStatus;
  createdAt: string;
  createdBy: string;
}

export interface Requirement {
  id: string;
  mandateId: string;
  requirementCode: string;
  techStack: string;
  intakeType: string;
  expLevel: string;
  location: string;
  onboardingDate: string;
  openPositions: number;
  filledPositions: number;
  status: RequirementStatus;
  targetCoeIds: string[];
  createdAt: string;
}

export interface HiringDrive {
  id: string;
  coeId: string;
  driveName: string;
  date: string;
  venue: string;
  techCovered: string[];
  coordinatorId: string;
  notes: string;
  status: DriveStatus;
  createdAt: string;
}

export interface Candidate {
  id: string;
  coeId: string;
  name: string;
  email: string;
  phone: string;
  graduationYear: number;
  stream: string;
  skills: string[];
  resumeLink: string;
  assessmentScore: number;
  status: CandidateStatus;
  externalKey: string;
  availabilityDate: string;
  createdAt: string;
}

export interface CandidateSelection {
  id: string;
  hiringDriveId: string;
  candidateId: string;
  selectionStatus: string;
  scores: Record<string, number>;
}

export interface Mapping {
  id: string;
  requirementId: string;
  status: MappingStatus;
  createdBy: string;
  currentOwnerRole: UserRole;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MappingLineItem {
  id: string;
  mappingId: string;
  candidateId: string;
  proposedTech: string;
  allocationType: 'Primary' | 'Secondary';
}

export interface Approval {
  id: string;
  mappingId: string;
  actorRole: UserRole;
  actorId: string;
  decision: ApprovalDecision;
  comment: string;
  timestamp: string;
}

export interface DiscussionLog {
  id: string;
  mappingLineItemId: string;
  coordinatorId: string;
  outcome: DiscussionOutcome;
  notes: string;
  followUpDate: string | null;
  createdAt: string;
}

export interface LOI {
  id: string;
  candidateId: string;
  requirementId: string;
  mappingId: string;
  sentAt: string;
  signedAt: string | null;
  documentUrl: string;
  status: LOIStatus;
}

export interface CFPEnrollment {
  id: string;
  candidateId: string;
  coeId: string;
  requirementId: string;
  startedAt: string;
  status: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  linkTo: string;
}

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  timestamp: string;
}

// ─── API / UI helpers ─────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface ApiError {
  message: string;
  status: number;
}
