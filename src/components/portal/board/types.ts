export type BoardJob = {
  id: string;
  workOrderNumber: string;
  jobType: string;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED";
  customerName: string;
  foreman: { id: string; name: string } | null;
  projectStartDate: string | null;
  createdAt: string;
};
