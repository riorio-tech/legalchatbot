"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
}

export default function KnowledgePage() {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const handleAddKnowledge = () => {
    if (!title.trim() || !content.trim() || !category.trim()) return;

    const newItem: KnowledgeItem = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      createdAt: new Date(),
    };

    setKnowledgeItems(prev => [newItem, ...prev]);
    setTitle("");
    setContent("");
    setCategory("");
  };

  const handleDeleteKnowledge = (id: string) => {
    setKnowledgeItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              法務ナレッジ管理
            </h1>
            <p className="text-gray-600">
              自社の法務知見を追加して、AIの分析精度を向上させます
            </p>
          </div>

          {/* ナレッジ追加フォーム */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>新しいナレッジを追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル
                  </label>
                  <Input
                    placeholder="例: 取引先との契約における注意点"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリ
                  </label>
                  <Input
                    placeholder="例: 契約法、労働法、知的財産"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容
                </label>
                <Textarea
                  placeholder="法務知見の詳細を入力してください..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleAddKnowledge}
                  disabled={!title.trim() || !content.trim() || !category.trim()}
                  className="px-6"
                >
                  ナレッジを追加
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ナレッジ一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>登録済みナレッジ ({knowledgeItems.length}件)</CardTitle>
            </CardHeader>
            <CardContent>
              {knowledgeItems.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>まだナレッジが登録されていません。</p>
                  <p>上記フォームから追加してください。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {knowledgeItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {item.title}
                          </h3>
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                            {item.category}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteKnowledge(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          削除
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">
                        {item.content}
                      </p>
                      <div className="text-xs text-gray-500 mt-2">
                        追加日: {item.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 