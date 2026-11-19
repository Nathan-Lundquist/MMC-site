import { redirect } from "next/navigation";

// The job-type picker now lives at the portal home page.
export default function JobTypesRedirect() {
  redirect("/portal");
}
