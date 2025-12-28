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

export async function sendHospitalVerificationEmail({
  hospitalEmail,
  hospitalName,
}) {
  const html = `
    <div style="font-family: Arial; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">Hospital Verified ✅</h2>

      <p>Dear <b>${hospitalName}</b>,</p>

      <p>
        We are pleased to inform you that your hospital profile on
        <b>DocSpace</b> has been <b>successfully verified</b>.
      </p>

      <p>
        You can now post job openings, manage applications, and connect
        with doctors on the platform.
      </p>

      <p style="margin-top:20px;">
        Regards,<br/>
        <b>DocSpace Team</b>
      </p>
    </div>
  `;

  await sendMail({
    to: hospitalEmail,
    subject: "Your Hospital Has Been Verified – DocSpace",
    html,
  });
}

export async function sendHospitalRejectionEmail({
  hospitalEmail,
  hospitalName,
  rejectionReason,
}) {
  const html = `
    <div style="font-family: Arial; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #ef4444;">Hospital Verification Update</h2>

      <p>Dear <b>${hospitalName}</b>,</p>

      <p>
        Thank you for registering your hospital on <b>DocSpace</b>.
        After reviewing your submitted documents, we are unable to
        verify your hospital profile at this time.
      </p>

      ${
        rejectionReason
          ? `<p><b>Reason:</b><br/>${rejectionReason}</p>`
          : ""
      }

      <p>
        You may update your documents and resubmit your profile for
        verification.
      </p>

      <p style="margin-top:20px;">
        If you believe this was a mistake, feel free to contact our support team.
      </p>

      <p>
        Regards,<br/>
        <b>DocSpace Team</b>
      </p>
    </div>
  `;

  await sendMail({
    to: hospitalEmail,
    subject: "Hospital Verification Rejected – DocSpace",
    html,
  });
}
