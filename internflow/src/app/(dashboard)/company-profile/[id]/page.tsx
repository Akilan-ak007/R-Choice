import { redirect } from "next/navigation";

export default async function CompanyProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  redirect(`/companies/${id}`);
}
