export type EventName = 'TaskCreated' | 'TaskAssigned' | 'TaskCancelled' | 'TaskCompleted'

export const EventTypes: Record<EventName, string> = {
  TaskCreated: 'created',
  TaskAssigned: 'assigned',
  TaskCancelled: 'cancelled',
  TaskCompleted: 'completed',
}

export const Status = {
  NEW: 0,
  ASSIGNED: 1,
  STARTED: 2,
  CANCELLED: 3,
  SUSPENDED: 4,
  COMPLETED: 5,
}

export const ClaimResolution = {
  OPEN: 0,
  APPROVED: 1,
  DENIED: 2,
  DISPUTE: 3,
}
