import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory runtime override if set programmatically
let runtimeCustomApiKey: string | null = null;

/**
 * Retrieve and sanitize Gemini API Key from environment or request
 */
function getApiKey(req?: express.Request): string | null {
  // 1. Runtime custom key if set
  if (runtimeCustomApiKey) {
    return runtimeCustomApiKey;
  }

  // 2. Request header override if provided
  const headerKey = req?.headers?.['x-gemini-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    const cleaned = headerKey.trim().replace(/^["']|["']$/g, '');
    if (cleaned && cleaned !== 'MY_GEMINI_API_KEY') {
      return cleaned;
    }
  }

  // 3. Environment variables in priority order
  const rawKey = 
    process.env.GEMINI_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.API_KEY || 
    process.env.VITE_GEMINI_API_KEY;

  if (!rawKey) return null;

  const cleaned = rawKey.trim().replace(/^["']|["']$/g, '').trim();

  // Guard against placeholder template values
  if (
    !cleaned || 
    cleaned === 'MY_GEMINI_API_KEY' || 
    cleaned === 'YOUR_API_KEY' || 
    cleaned === 'YOUR_GEMINI_API_KEY' ||
    cleaned === 'PLACEHOLDER'
  ) {
    return null;
  }

  return cleaned;
}

/**
 * Initialize GoogleGenAI client with User-Agent telemetry
 */
function getGenAI(req?: express.Request): GoogleGenAI {
  const apiKey = getApiKey(req);
  if (!apiKey) {
    const err: any = new Error("GEMINI_API_KEY is not configured.");
    err.status = 401;
    err.code = "MISSING_KEY";
    throw err;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Generate AI Content with automatic fallback between gemini-3.8-flash and gemini-3.6-flash
 */
async function generateAIContent(ai: GoogleGenAI, prompt: string) {
  const primaryModel = "gemini-3.8-flash";
  const fallbackModel = "gemini-3.6-flash";

  const config = {
    responseMimeType: "application/json",
  };

  try {
    return await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
      config,
    });
  } catch (err: any) {
    const isModelIssue = 
      err?.status === 503 || 
      err?.status === 404 || 
      err?.message?.includes("503") || 
      err?.message?.includes("404") ||
      err?.message?.includes("high demand") ||
      err?.message?.includes("no longer available");

    if (isModelIssue) {
      console.warn(`Primary model ${primaryModel} unavailable (${err?.status}), falling back to ${fallbackModel}`);
      return await ai.models.generateContent({
        model: fallbackModel,
        contents: prompt,
        config,
      });
    }
    throw err;
  }
}

/**
 * Structured error handler for AI requests
 */
function handleAIError(res: express.Response, error: any) {
  console.error("AI Generation Error:", error);
  const msg = error?.message || "";
  const status = error?.status || (msg.includes("401") ? 401 : msg.includes("503") ? 503 : 500);

  if (
    status === 401 || 
    error?.code === "MISSING_KEY" ||
    msg.includes("401") || 
    msg.includes("UNAUTHENTICATED") || 
    msg.includes("API_KEY_INVALID") ||
    msg.includes("API key not valid") ||
    msg.includes("not configured")
  ) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      error: "เกิดข้อผิดพลาด 401 Unauthorized: API Key ไม่ถูกต้อง หมดอายุ หรือยังไม่ได้ตั้งค่า กรุณาตรวจสอบหรือกำหนด GEMINI_API_KEY ในเมนู Settings > Secrets ของระบบ AI Studio",
    });
  }

  if (status === 429 || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return res.status(429).json({
      success: false,
      code: "RATE_LIMIT",
      error: "การเรียกใช้งานเกินโควตาชั่วคราว (Rate limit exceeded) กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
    });
  }

  if (status === 503 || msg.includes("503") || msg.includes("high demand")) {
    return res.status(503).json({
      success: false,
      code: "UNAVAILABLE",
      error: "ระบบ AI กำลังมีผู้ใช้งานหนาแน่นชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่",
    });
  }

  return res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    error: error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับผู้ช่วย AI",
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Key Status & Diagnostic endpoint
app.get("/api/ai/status", (req, res) => {
  const apiKey = getApiKey(req);
  if (!apiKey) {
    return res.json({
      status: "unconfigured",
      configured: false,
      message: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY กรุณากำหนดในเมนู Settings > Secrets ของระบบ AI Studio",
    });
  }

  const masked = apiKey.length > 8 
    ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` 
    : '***';

  return res.json({
    status: "configured",
    configured: true,
    maskedKey: masked,
    model: "gemini-3.8-flash (fallback: gemini-3.6-flash)",
    message: "เชื่อมต่อกับระบบ Gemini API พร้อมใช้งาน",
  });
});

// AI Key Dynamic Configuration endpoint
app.post("/api/ai/set-key", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== "string") {
    return res.status(400).json({ success: false, error: "กรุณาระบุ API Key ที่ถูกต้อง" });
  }

  const cleaned = apiKey.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) {
    return res.status(400).json({ success: false, error: "API Key ต้องไม่เป็นค่าว่าง" });
  }

  try {
    const testAi = new GoogleGenAI({
      apiKey: cleaned,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    await testAi.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'ping',
    });

    runtimeCustomApiKey = cleaned;
    process.env.GEMINI_API_KEY = cleaned;

    return res.json({
      success: true,
      message: "ทดสอบและตั้งค่า API Key สำเร็จ พร้อมใช้งานระบบ AI แล้ว",
    });
  } catch (err: any) {
    return handleAIError(res, err);
  }
});

// AI Endpoint 1: Generate Structured Post-Lesson Reflection (บันทึกหลังสอน)
app.post("/api/ai/generate-reflection", async (req, res) => {
  try {
    const { subjectName, gradeLevel, topic, teachingMethod, rawNotes, studentStats } = req.body;

    if (!rawNotes || !topic) {
      return res.status(400).json({ error: "กรุณาระบุหัวข้อเรื่องและสรุปสั้นๆ ในห้องเรียน" });
    }

    const ai = getGenAI(req);

    const prompt = `คุณคือผู้เชี่ยวชาญด้านนิเทศการสอนและครูมืออาชีพในประเทศไทย 
หน้าที่ของคุณคือเขียน "บันทึกหลังการจัดกิจกรรมการเรียนรู้" (บันทึกหลังสอน) ภาษาไทยที่เป็นทางการ ถูกต้องตามหลักวิชาการและราชการ

ข้อมูลวิชา:
- วิชา: ${subjectName || 'วิทยาศาสตร์'} ชั้น: ${gradeLevel || 'ม.3'}
- เรื่อง/หน่วยการเรียนรู้: ${topic}
- เทคนิค/รูปแบบการสอน: ${teachingMethod || 'Active Learning'}
- จำนวนนักเรียน: เข้าเรียน ${studentStats?.presentCount || 30} จากทั้งหมด ${studentStats?.totalCount || 30} คน
- ประเด็นสั้นๆ จากครู: "${rawNotes}"

จงสังเคราะห์และสร้างบันทึกหลังสอนแบ่งเป็น 3 หัวข้ออย่างชัดเจน ลึกซึ้ง และนำไปใช้งานได้จริง:
1. **ผลการจัดการเรียนรู้**: (วิเคราะห์ผลสัมฤทธิ์ ความเข้าใจ และพฤติกรรมการมีส่วนร่วมของนักเรียน)
2. **ปัญหา / อุปสรรค**: (วิเคราะห์จุดที่นักเรียนยังไม่เข้าใจ หรือปัญหาเชิงเทคนิค/เวลา/พฤติกรรม)
3. **ข้อเสนอแนะ / แนวทางการแก้ไข**: (เสนอวิธีแก้ปัญหาเชิงรูปธรรม Active Learning หรือการสอนซ่อมเสริม)

ส่งคืนคำตอบเป็น JSON รูปแบบนี้เท่านั้น:
{
  "outcomes": "ข้อความผลการเรียนรู้...",
  "problems": "ข้อความปัญหาอุปสรรค...",
  "solutions": "ข้อความข้อเสนอแนะแนวทางแก้ไข..."
}`;

    const response = await generateAIContent(ai, prompt);

    const text = response.text;
    if (!text) {
      throw new Error("ไม่ได้รับคำตอบจาก AI");
    }

    const parsed = JSON.parse(text);
    return res.json({ success: true, reflection: parsed });

  } catch (error: any) {
    return handleAIError(res, error);
  }
});

// AI Endpoint 2: Remediation & Active Learning Plan (วิเคราะห์แผนซ่อมเสริม & เทคนิคการสอน)
app.post("/api/ai/remediation-plan", async (req, res) => {
  try {
    const { subjectName, gradeLevel, problemDescription } = req.body;

    if (!problemDescription) {
      return res.status(400).json({ error: "กรุณาระบุปัญหาการเรียนรู้ของนักเรียน" });
    }

    const ai = getGenAI(req);

    const prompt = `คุณคือศึกษานิเทศก์เชี่ยวชาญด้าน Active Learning ของกระทรวงศึกษาธิการ
วิชา: ${subjectName || 'ทั่วไป'} ระดับชั้น: ${gradeLevel || 'มัธยมศึกษา'}
ปัญหาที่พบในชั้นเรียน: "${problemDescription}"

กรุณาเสนอแนะแนวทางแก้ไขและกิจกรรมซ่อมเสริม 3 แนวทางที่นำไปปฏิบัติได้จริงในห้องเรียนไทย
ส่งคืนคำตอบเป็น JSON ดังนี้:
{
  "summaryAnalysis": "วิเคราะห์สาเหตุของปัญหาใน 1-2 ประโยค",
  "strategies": [
    {
      "title": "ชื่อเทคนิค/กิจกรรม",
      "type": "การสอนซ่อมเสริม / เกมการเรียนรู้ / เพื่อนช่วยเพื่อน / สื่อมัลติมีเดีย",
      "steps": "ขั้นตอนการดำเนินกิจกรรมสั้นๆ",
      "expectedOutcome": "ผลลัพธ์ที่คาดว่าจะได้รับ"
    }
  ]
}`;

    const response = await generateAIContent(ai, prompt);

    const text = response.text;
    if (!text) throw new Error("ไม่ได้รับคำตอบจาก AI");

    const parsed = JSON.parse(text);
    return res.json({ success: true, plan: parsed });

  } catch (error: any) {
    return handleAIError(res, error);
  }
});

// AI Endpoint 3: Lesson Hook / Activity Idea Generator (ช่วยคิดกิจกรรมนำเข้าสู่บทเรียน)
app.post("/api/ai/lesson-hook", async (req, res) => {
  try {
    const { subjectName, gradeLevel, topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "กรุณาระบุหัวข้อเรื่อง" });
    }

    const ai = getGenAI(req);

    const prompt = `คุณคือครูต้นแบบ Active Learning
ต้องการไอเดียกิจกรรมนำเข้าสู่บทเรียน (Hook/Warm-up Activity) 5-10 นาที
วิชา: ${subjectName || 'วิทยาศาสตร์'} ชั้น: ${gradeLevel || 'ม.3'} เรื่อง: "${topic}"

เสนอไอเดีย 3 รูปแบบที่น่าสนใจ กระตุ้นความสนใจนักเรียนไทย (เช่น คำถามชวนคิด, เกมสั้น, คำถามวิเคราะห์จากภาพ/วิดีโอ)
ส่งคืน JSON:
{
  "hooks": [
    {
      "title": "ชื่อกิจกรรม",
      "duration": "5 นาที",
      "description": "รายละเอียดกิจกรรมสั้นๆ",
      "question": "คำถามกระตุ้นความคิดชวนตอบ"
    }
  ]
}`;

    const response = await generateAIContent(ai, prompt);

    const text = response.text;
    if (!text) throw new Error("ไม่ได้รับคำตอบจาก AI");

    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });

  } catch (error: any) {
    return handleAIError(res, error);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
