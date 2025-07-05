import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import Tesseract from "tesseract.js";

export const runtime = "nodejs";

async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mime = file.type;
  const name = file.name.toLowerCase();

  try {
    // PDFは未対応
    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      return "[PDF抽出未対応]";
    }
    if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/msword" ||
      name.endsWith(".docx") ||
      name.endsWith(".doc")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    if (
      mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mime === "application/vnd.ms-excel" ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls")
    ) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let text = "";
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        text += XLSX.utils.sheet_to_csv(sheet) + "\n";
      });
      return text;
    }
    if (mime.startsWith("image/")) {
      const { data } = await Tesseract.recognize(buffer, "jpn+eng");
      return data.text;
    }
    return "[未対応ファイル形式]";
  } catch (e: any) {
    return `[ファイル抽出エラー: ${e?.message || e}]`;
  }
}

export async function POST(req: NextRequest) {
  let message = "";
  let extractedTexts: string[] = [];
  let debugInfo: any = {};
  let customPrompt = "";

  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.startsWith("multipart/form-data")) {
      const formData = await req.formData();
      message = formData.get("message")?.toString() || "";
      customPrompt = formData.get("customPrompt")?.toString() || "";
      const files = formData.getAll("file");
      for (const file of files) {
        if (file && typeof file === "object" && "arrayBuffer" in file) {
          const text = await extractTextFromFile(file as File);
          extractedTexts.push(text);
        }
      }
    } else {
      const body = await req.json();
      message = body.message || "";
      customPrompt = body.customPrompt || "";
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ result: { content: "OpenAI APIキーが設定されていません。" }, debug: { step: "apikey" } }, { status: 500 });
    }

    let userPrompt = message;
    if (extractedTexts.length > 0) {
      userPrompt = `【重要】以下はアップロードされた契約書等の内容です。この内容を必ず参照し、本文から条文番号や該当箇所を明記して、具体的なリスクや懸念点を抜き出して列挙してください。一般論は不要です。必ず本文の記載内容に基づく指摘を優先してください。\n\n${extractedTexts.join("\n---\n")}\n\n質問: ${message}`;
    }
    if (customPrompt) {
      userPrompt += `\n【追加指示】${customPrompt}`;
    }

    debugInfo.extractedTexts = extractedTexts;
    debugInfo.userPrompt = userPrompt;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        max_tokens: 2048,
        messages: [
          { role: "system", content: "あなたは一流の弁護士です。アップロードされた契約書等の内容を必ず精査し、本文から条文番号や該当箇所を明記して、具体的なリスクや懸念点を厳しく列挙してください。一般論だけでなく、本文の記載内容に基づく指摘を優先してください。" },
          { role: "user", content: userPrompt }
        ]
      })
    });

    debugInfo.openaiStatus = openaiRes.status;
    debugInfo.openaiStatusText = openaiRes.statusText;

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return NextResponse.json({ result: { content: `OpenAI APIリクエストに失敗: ${openaiRes.status} ${openaiRes.statusText}\n${errText}` }, debug: debugInfo }, { status: 500 });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content || "AI応答の取得に失敗しました。";
    return NextResponse.json({ result: { content }, debug: debugInfo });
  } catch (e: any) {
    return NextResponse.json({ result: { content: `サーバーエラー: ${e?.message || e}` }, debug: { error: e?.stack || e } }, { status: 500 });
  }
} 