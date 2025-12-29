import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/* ================= VERIFICATION EMAIL ================= */

export async function sendHospitalVerificationEmail({
  hospitalEmail,
  hospitalName,
}) {
  console.log(" [RESEND] Sending verification email");

  return resend.emails.send({
    from: "DocSpace <onboarding@resend.dev>", // change after domain verification
    to: hospitalEmail,
    subject: "Hospital Verified 🎉",
    html: `
      <h2>Verification Successful</h2>
      <p><strong>${hospitalName}</strong> has been verified.</p>
      <p>You can now post jobs and access all features.</p>
    `,
  });
}

/* ================= REJECTION EMAIL ================= */

export async function sendHospitalRejectionEmail({
  hospitalEmail,
  hospitalName,
  rejectionReason,
}) {
  console.log("📨 [RESEND] Sending rejection email");

  return resend.emails.send({
    from: "DocSpace <onboarding@resend.dev>",
    to: hospitalEmail,
    subject: "Hospital Verification Update",
    html: `
      <h2>Verification Rejected</h2>
      <p><strong>${hospitalName}</strong> could not be verified.</p>
      <p><strong>Reason:</strong> ${rejectionReason || "Not specified"}</p>
    `,
  });
}
