const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const SURVEY_ALERT_TO = process.env.SURVEY_ALERT_TO || "shout@onepointconsult.com";

async function sendEmailJs(payload) {
  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Failed to send EmailJS message: ${response.status} ${err}`);
  }
}

export async function sendSurveySubmissionEmail({ responseId, role, completedAt, appUrl }) {
  const serviceId = process.env.EMAILJS_SERVICE_ID || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_PRIVATE_TOKEN;

  if (!serviceId || !templateId || !publicKey) {
    return {
      skipped: true,
      reason: "EmailJS not configured (missing EMAILJS_SERVICE_ID / EMAILJS_TEMPLATE_ID / EMAILJS_PUBLIC_KEY)",
    };
  }

  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || "";
  const responsesUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/survey-responses` : "/survey-responses";

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    public_key: publicKey,
    template_params: {
      to_email: SURVEY_ALERT_TO,
      email: SURVEY_ALERT_TO,
      recipient: SURVEY_ALERT_TO,
      survey_response_id: responseId,
      survey_role: role,
      completed_at: completedAt,
      responses_url: responsesUrl,
      message: `A new PrimaryAI survey has been submitted (${role}).`,
    },
  };

  // First try using private access token (recommended for server-side sending).
  if (privateKey) {
    try {
      await sendEmailJs({ ...payload, accessToken: privateKey });
      return { ok: true, provider: "emailjs", to: SURVEY_ALERT_TO, mode: "private" };
    } catch (error) {
      // Some EmailJS templates/accounts are only configured for public-key sends.
      // Fall through to a second attempt without access token.
      console.error("EmailJS private send failed, retrying without private token", error);
    }
  }

  await sendEmailJs(payload);
  return { ok: true, provider: "emailjs", to: SURVEY_ALERT_TO, mode: "public" };
}
