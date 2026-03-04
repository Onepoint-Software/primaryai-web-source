export function isLeaderSession(session) {
  if (!session?.userId) return false;

  const role = String(session.role || "").toLowerCase();
  const email = String(session.email || "").toLowerCase();
  if (["owner", "admin", "leader", "headteacher", "trustleader", "director"].includes(role)) {
    return true;
  }

  const adminEmails = String(process.env.SURVEY_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.includes(email)) {
    return true;
  }

  const adminDomains = String(process.env.SURVEY_ADMIN_DOMAINS || "onepointconsult.com")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  return adminDomains.some((domain) => email.endsWith(`@${domain}`));
}
