export interface LogEntry {
  staffId: string;
  name: string;
  dateClockIn: string;
  clockInTime: string;
  clockInLat: string;
  clockInLong: string;
  dateClockOut: string;
  clockOutTime: string;
  clockOutLat: string;
  clockOutLong: string;
  siteId: string;
  workingHours: string;
}

export interface Employee {
  lineId: string;
  staffId: string;
  name: string;
  siteId: string;
  roleType: string;
  position: string;
}

export interface Shift {
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  gracePeriod: number;
  lateThreshold: number;
}

export interface RawData {
  logs: any[][];
  employees: any[][];
  shifts: any[][];
}
