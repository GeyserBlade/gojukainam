export interface Parent {
  _id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  familyId?: string; // references Family._id
}
