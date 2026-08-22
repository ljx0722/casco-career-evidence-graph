import { chromium } from "playwright";

const baseUrl = process.env.CAREER_GRAPH_URL ?? "http://127.0.0.1:5174/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors: string[] = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(baseUrl, { waitUntil: "networkidle" });
if ((await page.locator("h1").count()) !== 1) throw new Error("首页标题缺失");
if ((await page.locator(".hero-card").count()) < 4) throw new Error("总览卡片缺失");
await page.getByText("岗位雷达", { exact: true }).click();
if ((await page.locator(".requirement-card").count()) !== 8) throw new Error("岗位要求卡片数量不符");
await page.getByText("证据图谱", { exact: true }).click();
await page.waitForTimeout(700);
if ((await page.locator(".graph-canvas").count()) !== 1) throw new Error("证据图谱画布缺失");
if (errors.length) throw new Error(`浏览器控制台错误：${errors.join(" | ")}`);
console.log("browser smoke passed");
await browser.close();
