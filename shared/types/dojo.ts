export interface Dojo {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  instructorId?: string; // references Student._id
  contactEmail?: string;
  contactPhone?: string;
}
