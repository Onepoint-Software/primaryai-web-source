import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:3000";

function pad(n) {
  return String(n).padStart(2, "0");
}

function isoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function mondayOf(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildFixtures() {
  const today = new Date();
  const monday = mondayOf(today);
  const weekDates = Array.from({ length: 5 }, (_, index) => isoDate(addDays(monday, index)));
  const todayIso = isoDate(today);
  const termStart = isoDate(addDays(today, -18));
  const termEnd = isoDate(addDays(today, 42));

  const libraryItems = [
    {
      id: "pack-1",
      title: "Year 4 Maths - Fractions Foundations",
      yearGroup: "Year 4",
      year_group: "Year 4",
      subject: "Maths",
      topic: "Fractions Foundations",
      createdAt: new Date(addDays(today, -1)).toISOString(),
      created_at: new Date(addDays(today, -1)).toISOString(),
    },
  ];

  const dashboardSummary = {
    email: "sarah.johnson@oakfieldprimary.co.uk",
    profileSetup: { displayName: "Sarah", avatarUrl: "" },
    libraryItems,
    scheduleEvents: [
      { id: "evt-1", title: "Maths - Fractions", subject: "Maths", year_group: "Year 4", event_type: "lesson_pack", event_category: null, scheduled_date: weekDates[0], start_time: "09:00:00", end_time: "10:00:00" },
      { id: "evt-2", title: "English - Writing", subject: "English", year_group: "Year 3", event_type: "lesson_pack", event_category: null, scheduled_date: weekDates[1], start_time: "11:00:00", end_time: "12:00:00" },
      { id: "evt-3", title: "Science - Forces", subject: "Science", year_group: "Year 5", event_type: "lesson_pack", event_category: null, scheduled_date: weekDates[2], start_time: "13:30:00", end_time: "14:30:00" },
      { id: "evt-4", title: "PPA", subject: "Personal", year_group: "", event_type: "custom", event_category: "personal", scheduled_date: todayIso, start_time: "15:30:00", end_time: "16:00:00" },
    ],
    upNextEvents: [],
    tasks: [],
    activeTerm: { termName: "Spring 2", termStartDate: termStart, termEndDate: termEnd, daysRemaining: 42 },
  };

  return {
    dashboardSummary,
    tasks: { tasks: [] },
    librarySummary: { items: libraryItems },
    terms: {
      ok: true,
      activeTerm: { id: "term-1", termName: "Spring 2", termStartDate: termStart, termEndDate: termEnd },
      terms: [{ id: "term-1", termName: "Spring 2", termStartDate: termStart, termEndDate: termEnd }],
    },
    scheduleFeed: { events: dashboardSummary.scheduleEvents },
    bankHolidays: { events: [] },
    outlookStatus: { connected: false, email: null },
    googleStatus: { connected: false, email: null },
  };
}

async function installRoutes(page, fixtures) {
  await page.route("**/api/dashboard/summary", async (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.dashboardSummary) }),
  );
  await page.route("**/api/tasks?**", async (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.tasks) }),
  );
  await page.route("**/api/profile/terms", async (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.terms) }),
  );
  await page.route("**/api/calendar/bank-holidays?**", async (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.bankHolidays) }),
  );
  await page.route("**/api/schedule/outlook-status", async (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.outlookStatus) }),
  );
  await page.route("**/api/schedule/google-status", async (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.googleStatus) }),
  );
  await page.route("**/api/schedule?**", async (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.scheduleFeed) }),
  );
  await page.route("**/api/library?**", async (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.librarySummary) }),
  );
}

const fixtures = buildFixtures();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
await context.addCookies([
  {
    name: "pa_session",
    value: JSON.stringify({ userId: "landing-demo-user", email: fixtures.dashboardSummary.email, role: "authenticated" }),
    domain: "127.0.0.1",
    path: "/",
    httpOnly: false,
  },
  {
    name: "pa_profile_complete",
    value: "1",
    domain: "127.0.0.1",
    path: "/",
    httpOnly: false,
  },
]);
const page = await context.newPage();
await installRoutes(page, fixtures);
await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const metrics = await page.evaluate(() => {
  const scroller = document.querySelector(".scheduler-cal-scroll");
  const schedulerInline = document.querySelector(".scheduler-inline");
  const drawerInner = document.querySelector(".scheduler-drawer-inner");
  const labels = Array.from(document.querySelectorAll(".scheduler-time-label")).slice(0, 20).map((el) => el.textContent?.trim() || "");
  if (!(scroller instanceof HTMLElement)) return { error: "no scroller", labels };
  return {
    scrollTop: scroller.scrollTop,
    clientHeight: scroller.clientHeight,
    scrollHeight: scroller.scrollHeight,
    inlineHeight: schedulerInline instanceof HTMLElement ? schedulerInline.clientHeight : null,
    inlineComputedHeight: schedulerInline ? getComputedStyle(schedulerInline).height : null,
    innerHeight: drawerInner instanceof HTMLElement ? drawerInner.clientHeight : null,
    innerComputedHeight: drawerInner ? getComputedStyle(drawerInner).height : null,
    scrollerComputedHeight: getComputedStyle(scroller).height,
    viewportHeight: window.innerHeight,
    labels,
    headerText: document.querySelector(".scheduler-week-label")?.textContent?.trim() || "",
  };
});

console.log(JSON.stringify(metrics, null, 2));

await browser.close();
