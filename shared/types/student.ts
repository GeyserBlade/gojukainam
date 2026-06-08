export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO date string
  gender: string;
  weight?: number;
  dojoId?: string; // references Dojo._id
  gradeId?: string; // references Grade._id
  titleId?: string; // references Title._id
  joinDate?: string; // ISO date string
  lastGraded?: string; // ISO date string
  contactEmail?: string;
  contactPhone?: string;
  familyId?: string; // references Family._id
  parents?: string[]; // array of Parent._id
  instructor?: boolean;
  active?: boolean;
}
