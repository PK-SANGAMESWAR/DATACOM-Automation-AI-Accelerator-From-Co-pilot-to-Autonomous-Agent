import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

// Load env variables
import { config } from "dotenv";
config();

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Dynamic Lookups (Simulated Firestore logic based on blueprint)
  const mockCustomers: any = {
    "sangameswarpk@gmail.com": { id: "SF-777", name: "Sangu PK", tier: "Platinum", creditLimit: 100000 },
    "sanguchachu@gmail.com":   { id: "SF-888", name: "Sangu Chachu", tier: "Gold", creditLimit: 50000 },
    "customer@example.com":    { id: "SF-101", name: "Acme Corp", tier: "Gold", creditLimit: 5000 }
  };

  const mockInventory: any = {
    "LAPTOP-01":  { stock: 15, price: 1200 },
    "MONITOR-02": { stock: 5, price: 300 }
  };

  // ─── /api/extract ──────────────────────────────────────────────────────────
  // Receives a PDF file and uses Gemini (server-side, key never exposed) to
  // extract the SKU and quantity from the Purchase Order.
  // ───────────────────────────────────────────────────────────────────────────
  app.post("/api/extract", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            parts: [
              {
                text: `Extract the SKU and Quantity from this Purchase Order PDF.
Return ONLY a valid JSON object like: { "sku": "...", "quantity": 0 }.
If you cannot find them, use "LAPTOP-01" and 1 as defaults.
Do not include any explanation or markdown formatting.`
              },
              {
                inlineData: {
                  data: req.file.buffer.toString("base64"),
                  mimeType: "application/pdf"
                }
              }
            ]
          }
        ]
      });

      const rawText = response.text?.replace(/```json|```/g, "").trim() ?? "{}";
      const extractedData = JSON.parse(rawText);

      res.json({ success: true, extractedData });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── /api/webhook ──────────────────────────────────────────────────────────
  // Receives pre-extracted order data, runs the fulfillment decision logic,
  // and returns a structured result with audit logs.
  // ───────────────────────────────────────────────────────────────────────────
  app.post("/api/webhook", async (req, res) => {
    try {
      const { email, extractedData } = req.body;

      if (!email || !extractedData) {
        return res.status(400).json({ error: "Email and extractedData are required" });
      }

      const customer  = mockCustomers[email];
      const stockItem = mockInventory[extractedData.sku];

      let decision = "APPROVE";
      let reason   = "";

      if (!customer) {
        decision = "REJECT";
        reason   = "Unknown Customer";
      } else if (!stockItem) {
        decision = "REJECT";
        reason   = `SKU ${extractedData.sku} not found in inventory`;
      } else if (stockItem.stock < extractedData.quantity) {
        decision = "REJECT";
        reason   = "Insufficient Stock";
      } else if (customer.creditLimit < stockItem.price * extractedData.quantity) {
        decision = "REJECT";
        reason   = "Credit Limit Exceeded";
      }

      // Build audit logs that mirror the architecture diagram:
      // Shared Inbox → Extract PDF → Salesforce → Sheets → Decision Action(s)
      const logs: { step: string; status: string; detail: string }[] = [
        { step: "Shared Inbox",          status: "Received", detail: `Email received from ${email}` },
        { step: "Extract PDF API",       status: "Success",  detail: `Extracted SKU: ${extractedData.sku}, Qty: ${extractedData.quantity}` },
        { step: "Query Salesforce API",  status: "Success",  detail: `Customer: ${customer?.name || "Unknown"} (${customer?.tier || "N/A"})` },
        { step: "Query Sheets API",      status: "Success",  detail: `Stock available: ${stockItem?.stock ?? 0} units @ $${stockItem?.price ?? 0}` },
      ];

      if (decision === "APPROVE") {
        logs.push({ step: "Send Approval Email",  status: "Success", detail: "Order confirmed — customer notified" });
        logs.push({ step: "Alert Warehouse",      status: "Success", detail: `Fulfillment triggered for SKU: ${extractedData.sku} × ${extractedData.quantity}` });
      } else {
        logs.push({ step: "Send Reject Email", status: "Success", detail: `Order rejected — Reason: ${reason}` });
      }

      res.json({
        success: true,
        decision,
        reason,
        data: {
          customer:      customer    || { name: "Unknown" },
          stockInfo:     stockItem   || { stock: 0, price: 0 },
          extractedData
        },
        logs
      });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
