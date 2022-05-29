export type EventName =
  | 'TaskCreated'
  | 'TaskAssigned'
  | 'TaskCancelled'
  | 'TaskCompleted'

export type StatusValue = 0 | 1 | 2 | 3 | 4 | 5
export type State =
  | 'NEW'
  | 'ASSIGNED'
  | 'STARTED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'COMPLETED'

export const EventTypes: Record<EventName, string> = {
  TaskCreated: 'created',
  TaskAssigned: 'assigned',
  TaskCancelled: 'cancelled',
  TaskCompleted: 'completed',
}

export const Status: Record<State, StatusValue> = {
  NEW: 0,
  ASSIGNED: 1,
  STARTED: 2,
  CANCELLED: 3,
  SUSPENDED: 4,
  COMPLETED: 5,
}

export const mapStatusToKey: Record<StatusValue, State> = {
  0: 'NEW',
  1: 'ASSIGNED',
  2: 'STARTED',
  3: 'CANCELLED',
  4: 'SUSPENDED',
  5: 'COMPLETED',
}

export const ClaimResolution = {
  OPEN: 0,
  APPROVED: 1,
  DENIED: 2,
  DISPUTE: 3,
}
