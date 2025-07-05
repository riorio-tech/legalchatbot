"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  attachments?: File[];
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<string[]>([]);
  const [userPrompt, setUserPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleSendMessage = async () => {
    if (!inputText.trim() && attachments.length === 0 && !customPrompt.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputText + (customPrompt ? `\n【追加プロンプト】${customPrompt}` : ""),
      timestamp: new Date(),
      attachments: [...attachments],
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setCustomPrompt("");
    setAttachments([]);
    setIsLoading(true);

    try {
      let res, data;
      setErrorDetail(null);
      const payload = { message: inputText, customPrompt };
      if (attachments.length > 0 && attachments[0].type === "application/pdf") {
        const formData = new FormData();
        formData.append("message", inputText);
        formData.append("customPrompt", customPrompt);
        attachments.forEach((file, idx) => {
          formData.append("file", file);
        });
        res = await fetch("/api/chat", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      data = await res.json();
      if (!res.ok) {
        setErrorDetail(JSON.stringify(data.debug, null, 2));
      }
      if (data.debug?.extractedTexts) {
        setExtractedTexts(data.debug.extractedTexts);
      }
      if (data.debug?.userPrompt) {
        setUserPrompt(data.debug.userPrompt);
      }
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.result.content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      setErrorDetail(String(e));
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          type: "ai",
          content: "AI応答の取得に失敗しました。",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              契約書レビューAI
            </h1>
            <p className="text-gray-600">
              一流の弁護士視点からリーガルリスクを分析します
            </p>
          </div>

          {/* チャットエリア */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                AI リーガルアシスタント
              </CardTitle>
            </CardHeader>
            <CardContent className="h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>契約書の内容や画像をアップロードして、</p>
                  <p>リーガルリスクの分析を開始してください。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.type === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm opacity-80">添付ファイル:</p>
                            {message.attachments.map((file, index) => (
                              <div key={index} className="text-sm opacity-80">
                                📎 {file.name}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-xs opacity-60 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="text-gray-600">分析中...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* エラー詳細表示 */}
          {errorDetail && (
            <div className="bg-red-100 text-red-800 p-4 my-4 rounded text-xs whitespace-pre-wrap">
              <b>デバッグ情報:</b>
              <pre>{errorDetail}</pre>
            </div>
          )}

          {/* 抽出テキスト表示 */}
          {extractedTexts.length > 0 && (
            <div className="bg-gray-100 text-gray-800 p-4 my-4 rounded text-xs whitespace-pre-wrap">
              <b>抽出テキスト:</b>
              <pre>{extractedTexts.join("\n---\n")}</pre>
            </div>
          )}

          {/* AIプロンプト表示 */}
          {userPrompt && (
            <div className="bg-blue-50 text-blue-800 p-4 my-4 rounded text-xs whitespace-pre-wrap">
              <b>AIに送信したプロンプト:</b>
              <pre>{userPrompt}</pre>
            </div>
          )}

          {/* 入力エリア */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* ファイルアップロード */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    📎 画像・ファイル追加
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {attachments.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {attachments.length}個のファイル
                    </span>
                  )}
                </div>

                {/* 添付ファイル表示 */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full text-sm"
                      >
                        <span>📎 {file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* テキスト入力 */}
                <Textarea
                  placeholder="契約書の内容を入力してください..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[100px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                {/* 追加プロンプト入力 */}
                <Input
                  placeholder="AIへの追加指示（例：特定条項のリスクを重点的に指摘して など）"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="mt-2"
                />

                {/* 送信ボタン */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || (!inputText.trim() && attachments.length === 0)}
                    className="px-6"
                  >
                    {isLoading ? "分析中..." : "リーガル分析を実行"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
