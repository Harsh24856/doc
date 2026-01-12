import { sendMail } from "../middleware/mailer.js";

export async function sendResumeApprovalEmail({
  userEmail,
  userName,
  hospitalName,
  hospitalPersonName,
  hospitalPersonEmail,
  interviewDate,
  jobTitle,
}) {
  const html = `
    <div style="font-family: Arial; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">Interview Scheduled 🎉</h2>
      <p>Dear <b>${userName}</b>,</p>

      <p>Your application for <b>${jobTitle}</b> at <b>${hospitalName}</b>
      has been approved.</p>

      <p><b>Interview Date:</b> ${interviewDate}</p>

      <p><b>Contact Person:</b><br/>
      ${hospitalPersonName}<br/>
      ${hospitalPersonEmail}</p>

      <p>Best of luck!<br/>DocSpace Team</p>
    </div>
  `;

  await sendMail({
    to: userEmail,
    subject: `Interview Scheduled – ${hospitalName}`,
    html,
  });
}

export async function sendApplicationRejectionEmail({
  userEmail,
  userName,
  hospitalName,
  jobTitle,
}) {
  const html = `
    <div style="font-family: Arial; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #ef4444;">Application Update</h2>
      <p>Dear <b>${userName}</b>,</p>

      <p>Thank you for your interest in the <b>${jobTitle}</b> position at <b>${hospitalName}</b>.</p>

      <p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>

      <p>We appreciate the time you took to apply and encourage you to explore other opportunities on DocSpace.</p>

      <p>Best regards,<br/>${hospitalName}<br/>DocSpace Team</p>
    </div>
  `;

  await sendMail({
    to: userEmail,
    subject: `Application Update – ${hospitalName}`,
    html,
  });
}