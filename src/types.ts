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
  lateThreshold: string;
}

export interface DashboardStats {
  totalStaff: number;
  lateStaff: number;
  onTimeStaff: number;
}

export interface AttendanceRecord {
  siteId: string;
  name: string;
  shiftCode: string;
  dateStart: string;
  startTime: string;
  dateEnd: string;
  endTime: string;
  status: 'สาย' | 'ไม่สาย' | 'ไม่ได้ทำงาน';
}
