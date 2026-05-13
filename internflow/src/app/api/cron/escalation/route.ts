import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  internshipRequests,
  notifications,
  users,
  approvalEscalations,
  approvalSlaSettings,
} from "@/lib/db/schema";
import { captureServerError } from "@/lib/observability";

const PENDING_STATUSES = [
  "pending_tutor",
  "pending_coordinator",
  "pending_hod",
  "pending_dean",
  "pending_po",
  "pending_coe",
  "pending_principal",
] as const;

const TIER_TO_ROLE: Record<number, typeof users.$inferSelect.role> = {
  1: "tutor",
  2: "placement_coordinator",
  3: "hod",
  4: "dean",
  5: "placement_officer",
  6: "coe",
  7: "principal",
};

async function getDefaultSlaHours() {
  const [setting] = await db
    .select({ slaHours: approvalSlaSettings.slaHours })
    .from(approvalSlaSettings)
    .where(eq(approvalSlaSettings.scope, "default_od"))
    .limit(1);

  return setting?.slaHours || 6;
}

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const suppliedSecret = req.headers.get("x-cron-secret");

  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const defaultSlaHours = await getDefaultSlaHours();
    const pendingRequests = await db
      .select()
      .from(internshipRequests)
      .where(inArray(internshipRequests.status, PENDING_STATUSES));

    let reminderCount = 0;
    let escalationCount = 0;

    for (const request of pendingRequests) {
      const tier = request.currentTier || 1;
      await db
        .update(approvalEscalations)
        .set({ resolvedAt: new Date() })
        .where(
          and(
            eq(approvalEscalations.requestId, request.id),
            isNull(approvalEscalations.resolvedAt),
            ne(approvalEscalations.escalatedFromTier, tier),
          ),
        );

      const enteredTierAt = request.currentTierEnteredAt || request.lastReviewedAt || request.submittedAt;
      if (!enteredTierAt) continue;

      const slaHours = request.currentTierSlaHours || defaultSlaHours;
      const elapsedHours = (Date.now() - new Date(enteredTierAt).getTime()) / (1000 * 60 * 60);
      if (elapsedHours < slaHours) continue;

      const stage = Math.floor(elapsedHours / slaHours);
      const currentRole = TIER_TO_ROLE[tier];
      const escalatedTier = Math.min(7, tier + Math.max(0, stage - 1));
      const escalatedRole = TIER_TO_ROLE[escalatedTier];
      const currentAuthorities = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, currentRole));

      const [existingEscalation] = await db
        .select()
        .from(approvalEscalations)
        .where(
          and(
            eq(approvalEscalations.requestId, request.id),
            eq(approvalEscalations.escalatedFromTier, tier),
            isNull(approvalEscalations.resolvedAt),
          ),
        )
        .limit(1);

      if (existingEscalation?.escalationStage === stage && existingEscalation.lastNotifiedAt) {
        const timeSinceLastNotification = Date.now() - new Date(existingEscalation.lastNotifiedAt).getTime();
        if (timeSinceLastNotification < 15 * 60 * 1000) {
          continue;
        }
      }

      for (const authority of currentAuthorities) {
        await db.insert(notifications).values({
          userId: authority.id,
          type: "approval_sla_reminder",
          title: "OD Approval Reminder",
          message: `OD approval for ${request.companyName} is still pending at your tier.`,
          linkUrl: "/approvals",
        });
        reminderCount++;
      }

      if (escalatedTier > tier) {
        const higherAuthorities = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, escalatedRole));

        for (const authority of higherAuthorities) {
          await db.insert(notifications).values({
            userId: authority.id,
            type: "approval_escalation",
            title: "OD Escalation Alert",
            message: `OD approval for ${request.companyName} has exceeded SLA and is escalated to your tier.`,
            linkUrl: "/approvals",
          });
          escalationCount++;
        }
      }

      if (existingEscalation) {
        await db
          .update(approvalEscalations)
          .set({
            escalatedFromTier: tier,
            escalatedToTier: escalatedTier,
            escalationStage: stage,
            escalationReason: `SLA breach after ${Math.floor(elapsedHours)} hours`,
            lastNotifiedAt: new Date(),
          })
          .where(eq(approvalEscalations.id, existingEscalation.id));
      } else {
        await db.insert(approvalEscalations).values({
          requestId: request.id,
          escalatedFromTier: tier,
          escalatedToTier: escalatedTier,
          escalationStage: stage,
          escalationReason: `SLA breach after ${Math.floor(elapsedHours)} hours`,
          lastNotifiedAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: reminderCount,
      escalationsSent: escalationCount,
    });
  } catch (error) {
    captureServerError(error, { scope: "cron-escalation-route" });
    return NextResponse.json({ error: "Escalation failed" }, { status: 500 });
  }
}
