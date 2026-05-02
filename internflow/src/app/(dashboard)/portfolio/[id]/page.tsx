import { redirect } from "next/navigation";

export default async function PortfolioPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  redirect(`/students/${id}`);
}
