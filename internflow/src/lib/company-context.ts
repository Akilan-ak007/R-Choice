import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { companyRegistrations, companyStaff } from "@/lib/db/schema";

export async function getCompanyContextForUser(userId: string) {
  const [ownedCompany] = await db
    .select({
      companyId: companyRegistrations.id,
      companyName: companyRegistrations.companyLegalName,
      membershipRole: companyRegistrations.ceoDesignation,
    })
    .from(companyRegistrations)
    .where(eq(companyRegistrations.userId, userId))
    .limit(1);

  if (ownedCompany) {
    return {
      companyId: ownedCompany.companyId,
      companyName: ownedCompany.companyName,
      membershipRole: ownedCompany.membershipRole || "owner",
    };
  }

  const [staffMembership] = await db
    .select({
      companyId: companyStaff.companyId,
      companyName: companyRegistrations.companyLegalName,
      membershipRole: companyStaff.roleInCompany,
    })
    .from(companyStaff)
    .innerJoin(companyRegistrations, eq(companyStaff.companyId, companyRegistrations.id))
    .where(and(eq(companyStaff.userId, userId), eq(companyStaff.isActive, true)))
    .limit(1);

  if (!staffMembership) {
    return null;
  }

  return staffMembership;
}

