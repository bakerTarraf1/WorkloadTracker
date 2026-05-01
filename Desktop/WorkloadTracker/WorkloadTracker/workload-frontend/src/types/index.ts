export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface Team {
  id: number;
  name: string;
  members: TeamMember[];
}

export interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
}

export interface TaskItem {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  complexity: Complexity;
  effortHours: number;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  assignedUser: string;
  assignedUserId: string;
  weight: number;
  complexityMultiplier?: number;
  priorityMultiplier?: number;
  statusHistory?: StatusHistory[];
  changeRequests?: ChangeRequest[];
}

export interface StatusHistory {
  id: number;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  changedAt: string;
  changedByUserId: string;
}

export interface ChangeRequest {
  id: number;
  taskItemId: number;
  taskTitle: string;
  requestedByUserId: string;
  type: ChangeRequestType;
  newValue: string;
  status: ChangeRequestStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface WorkloadMember {
  userId: string;
  fullName: string;
  totalTasks: number;
  totalEffort: number;
  totalWeight: number;
  status: 'Available' | 'Moderate' | 'Overloaded';
}

export interface WeightMultiplier {
  id: number;
  type: string;
  name: string;
  multiplier: number;
}

export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export enum Complexity {
  Simple = 0,
  Medium = 1,
  Complex = 2
}

export enum TaskStatus {
  New = 0,
  InProgress = 1,
  Blocked = 2,
  Done = 3
}

export enum ChangeRequestType {
  ChangeOwner = 0,
  ChangeDueDate = 1,
  IncreaseEffort = 2
}

export enum ChangeRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2
}