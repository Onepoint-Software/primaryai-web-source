import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const BASE_URL = "http://127.0.0.1:3000";
const OUTPUT_DIR = path.join(process.cwd(), "public", "images", "landing");
const DESKTOP_OUTPUTS = [
  path.join(OUTPUT_DIR, "dashboard-current.png"),
  path.join(OUTPUT_DIR, "scheduler-month-current.png"),
  path.join(OUTPUT_DIR, "scheduler-term-current.png"),
];
const MOBILE_OUTPUTS = [
  path.join(OUTPUT_DIR, "dashboard-current-mobile.png"),
  path.join(OUTPUT_DIR, "library-current-mobile.png"),
];

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

function buildPack(subject, yearGroup, topic) {
  return {
    year_group: yearGroup,
    subject,
    topic,
    learning_objectives: [
      `Explain the key ideas behind ${topic.toLowerCase()}.`,
      "Apply the concept independently in short tasks.",
      "Use clear subject vocabulary in discussion and work.",
    ],
    teacher_explanation: `A concise teaching explanation for ${topic}, sequenced for a mixed-attainment class.`,
    pupil_explanation: `We are learning ${topic.toLowerCase()} so we can use it confidently in our lesson today.`,
    worked_example: `Worked example:\n1. Model the first step.\n2. Think aloud.\n3. Review and improve the answer.`,
    common_misconceptions: [
      "Mixing up the key vocabulary.",
      "Skipping the checking step.",
    ],
    activities: {
      support: "Guided task with scaffolded prompts and worked steps.",
      expected: "Independent practice applying the core method.",
      greater_depth: "Extended reasoning challenge with justification.",
    },
    send_adaptations: [
      "Chunk instructions into short steps.",
      "Pre-teach essential vocabulary.",
    ],
    plenary: "Review what changed in pupils' confidence and identify the next small step.",
    mini_assessment: {
      questions: ["What is the first thing to check?", "How would you explain your answer?"],
      answers: ["The structure of the task.", "Using precise subject vocabulary."],
    },
    slides: [
      { title: topic, bullets: ["Learning goal", "Worked example", "Independent practice"] },
    ],
  };
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
      json: JSON.stringify(buildPack("Maths", "Year 4", "Fractions Foundations")),
    },
    {
      id: "pack-2",
      title: "Year 3 English - Persuasive Writing",
      yearGroup: "Year 3",
      year_group: "Year 3",
      subject: "English",
      topic: "Persuasive Writing",
      createdAt: new Date(addDays(today, -3)).toISOString(),
      created_at: new Date(addDays(today, -3)).toISOString(),
      json: JSON.stringify(buildPack("English", "Year 3", "Persuasive Writing")),
    },
    {
      id: "pack-3",
      title: "Year 5 Science - Forces and Motion",
      yearGroup: "Year 5",
      year_group: "Year 5",
      subject: "Science",
      topic: "Forces and Motion",
      createdAt: new Date(addDays(today, -6)).toISOString(),
      created_at: new Date(addDays(today, -6)).toISOString(),
      json: JSON.stringify(buildPack("Science", "Year 5", "Forces and Motion")),
    },
    {
      id: "pack-4",
      title: "Year 2 History - Great Fire of London",
      yearGroup: "Year 2",
      year_group: "Year 2",
      subject: "History",
      topic: "Great Fire of London",
      createdAt: new Date(addDays(today, -8)).toISOString(),
      created_at: new Date(addDays(today, -8)).toISOString(),
      json: JSON.stringify(buildPack("History", "Year 2", "Great Fire of London")),
    },
  ];

  const dashboardSummary = {
    email: "sarah.johnson@oakfieldprimary.co.uk",
    profileSetup: {
      displayName: "Sarah",
      avatarUrl: "",
    },
    libraryItems: libraryItems.map(({ json, ...item }) => item),
    scheduleEvents: [
      {
        id: "evt-1",
        title: "Maths - Fractions",
        subject: "Maths",
        year_group: "Year 4",
        event_type: "lesson_pack",
        event_category: null,
        scheduled_date: weekDates[0],
        start_time: "09:00:00",
        end_time: "10:00:00",
      },
      {
        id: "evt-2",
        title: "English - Writing",
        subject: "English",
        year_group: "Year 3",
        event_type: "lesson_pack",
        event_category: null,
        scheduled_date: weekDates[1],
        start_time: "11:00:00",
        end_time: "12:00:00",
      },
      {
        id: "evt-3",
        title: "Science - Forces",
        subject: "Science",
        year_group: "Year 5",
        event_type: "lesson_pack",
        event_category: null,
        scheduled_date: weekDates[2],
        start_time: "13:30:00",
        end_time: "14:30:00",
      },
      {
        id: "evt-4",
        title: "PPA",
        subject: "Personal",
        year_group: "",
        event_type: "custom",
        event_category: "personal",
        scheduled_date: todayIso,
        start_time: "15:30:00",
        end_time: "16:00:00",
      },
    ],
    upNextEvents: [
      {
        id: "evt-5",
        title: "Reading Intervention",
        subject: "English",
        year_group: "Year 3",
        event_type: "lesson_pack",
        event_category: null,
        scheduled_date: todayIso,
        start_time: "14:00:00",
        end_time: "14:30:00",
      },
      {
        id: "evt-6",
        title: "Parent Call",
        subject: "Personal",
        year_group: "",
        event_type: "custom",
        event_category: "personal",
        scheduled_date: todayIso,
        start_time: "16:15:00",
        end_time: "16:30:00",
      },
    ],
    tasks: [
      {
        id: "task-1",
        title: "Update guided reading groups",
        due_date: todayIso,
        due_time: "16:45:00",
        importance: "high",
        completed: false,
        created_at: new Date(addDays(today, -1)).toISOString(),
        updated_at: new Date(addDays(today, -1)).toISOString(),
      },
      {
        id: "task-2",
        title: "Print Friday maths exit tickets",
        due_date: isoDate(addDays(today, 1)),
        due_time: "08:00:00",
        importance: "low",
        completed: false,
        created_at: new Date(addDays(today, -2)).toISOString(),
        updated_at: new Date(addDays(today, -2)).toISOString(),
      },
    ],
    activeTerm: {
      termName: "Spring 2",
      termStartDate: termStart,
      termEndDate: termEnd,
      daysRemaining: 42,
    },
  };

  return {
    dashboardSummary,
    tasks: { tasks: dashboardSummary.tasks },
    librarySummary: { items: libraryItems.map(({ json, ...item }) => item) },
    libraryDetailById: Object.fromEntries(libraryItems.map((item) => [item.id, { item }])),
    terms: {
      ok: true,
      activeTerm: {
        id: "term-1",
        name: "Spring 2",
        startDate: termStart,
        endDate: termEnd,
      },
      terms: [
        { id: "term-1", name: "Spring 2", startDate: termStart, endDate: termEnd },
      ],
    },
    scheduleFeed: { events: dashboardSummary.scheduleEvents },
    bankHolidays: { holidays: [] },
    outlookStatus: { connected: false, email: null },
    googleStatus: { connected: false, email: null },
  };
}

async function installRoutes(page, fixtures) {
  await page.route("**/api/dashboard/summary", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.dashboardSummary) });
  });

  await page.route("**/api/tasks?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.tasks) });
  });

  await page.route("**/api/profile/terms", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.terms) });
  });

  await page.route("**/api/calendar/bank-holidays?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.bankHolidays) });
  });

  await page.route("**/api/schedule/outlook-status", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.outlookStatus) });
  });

  await page.route("**/api/schedule/google-status", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.googleStatus) });
  });

  await page.route("**/api/schedule?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.scheduleFeed) });
  });

  await page.route("**/api/library?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtures.librarySummary) });
  });

  await page.route("**/api/library/*", async (route) => {
    const url = new URL(route.request().url());
    const id = decodeURIComponent(url.pathname.split("/").pop() || "");
    const detail = fixtures.libraryDetailById[id];
    await route.fulfill({
      status: detail ? 200 : 404,
      contentType: "application/json",
      body: JSON.stringify(detail ?? { error: "Not found" }),
    });
  });
}

async function focusDashboardCapture(page) {
  await page.addStyleTag({
    content: `
      .scheduler-pack-panel { display: none !important; }
      .scheduler-drawer-inner { display: block !important; }
      .scheduler-cal-panel { width: 100% !important; }
      .scheduler-cal-scroll { height: 520px !important; max-height: 520px !important; }
      .dashboard-hero-side-wrap > div:nth-child(3) { display: none !important; }
      .dashboard-hero > *:not(.term-countdown-stat) { display: none !important; }
      .dashboard-hero-side-wrap { align-self: start !important; }
      .dashboard-top-grid { align-items: start !important; }
    `,
  });
}

async function setSchedulerMorningScroll(page) {
  await page.waitForSelector(".scheduler-cal-scroll");
  await page.evaluate(() => {
    const scroller = document.querySelector(".scheduler-cal-scroll");
    if (!(scroller instanceof HTMLElement)) return;
    scroller.scrollTop = 34 * 14 - 34;
  });
  await page.waitForTimeout(150);
}

async function screenshotTopGridSection(page, outputPath, maxHeight, clampToBox = true) {
  const topGrid = page.locator(".dashboard-top-grid").first();
  const box = await topGrid.boundingBox();
  if (!box) {
    throw new Error("Dashboard top grid not found for capture.");
  }
  await page.screenshot({
    path: outputPath,
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: box.width,
      height: clampToBox ? Math.min(box.height, maxHeight) : maxHeight,
    },
  });
}

async function captureDesktop(fixtures) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
    deviceScaleFactor: 1,
  });
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
  await focusDashboardCapture(page);
  await setSchedulerMorningScroll(page);
  await screenshotTopGridSection(page, DESKTOP_OUTPUTS[0], 980, false);

  await page.getByRole("button", { name: "month" }).click();
  await page.waitForLoadState("networkidle");
  await screenshotTopGridSection(page, DESKTOP_OUTPUTS[1], 980, false);

  await page.getByRole("button", { name: "term" }).click();
  await page.waitForLoadState("networkidle");
  await screenshotTopGridSection(page, DESKTOP_OUTPUTS[2], 980, false);
  await browser.close();
}

async function captureMobile(fixtures) {
  const browser = await chromium.launch();
  const iphone = devices["iPhone 13"];
  const context = await browser.newContext({
    userAgent: iphone.userAgent,
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
  });
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
  await focusDashboardCapture(page);
  await page.addStyleTag({
    content: `
      .scheduler-cal-scroll { height: 360px !important; max-height: 360px !important; }
      .dashboard-top-grid { gap: 0.75rem !important; }
    `,
  });
  await setSchedulerMorningScroll(page);
  await screenshotTopGridSection(page, MOBILE_OUTPUTS[0], 1180);
  await page.goto(`${BASE_URL}/library`, { waitUntil: "networkidle" });
  await page.locator("text=Year 4 Maths - Fractions Foundations").click();
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: MOBILE_OUTPUTS[1] });
  await browser.close();
}

async function main() {
  const fixtures = buildFixtures();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await captureDesktop(fixtures);
  await captureMobile(fixtures);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
