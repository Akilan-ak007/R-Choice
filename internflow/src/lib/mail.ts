const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || "development";

function logDelivery(kind: string, target: string, details: Record<string, string>) {
  const lines = Object.entries(details).map(([key, value]) => `${key}: ${value}`);
  console.log(
    "\n=========================================\n" +
      `[InternFlow Manual Delivery - ${APP_ENV.toUpperCase()}]\n` +
      `Type: ${kind}\n` +
      `Target: ${target}\n` +
      `${lines.join("\n")}\n` +
      "=========================================\n"
  );
}

export function getMailDeliveryMode() {
  return "manual";
}

export async function sendCompanyResultEmail(
  toEmail: string,
  studentName: string,
  companyName: string,
  jobRole: string,
  verificationCode: string
) {
  logDelivery("selection-result", toEmail, {
    student: studentName,
    company: companyName,
    role: jobRole,
    code: verificationCode,
  });
  return { success: true };
}

export async function sendCompanyApprovalEmail(
  toEmail: string,
  companyName: string,
  tempPassword: string
) {
  logDelivery("company-approval", toEmail, {
    company: companyName,
    temporaryPassword: tempPassword,
  });
  return { success: true };
}
