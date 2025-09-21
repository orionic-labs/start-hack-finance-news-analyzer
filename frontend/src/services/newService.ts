// src/services/newsService.ts
const API_URL = "http://localhost:5001/api";

export interface NewsItem {
  id: string;
  url: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  isImportant: boolean;
  markets: string[];
  clients: string[];
  importance: string;
  communitySentiment: number;
  trustIndex: number;
}

export async function fetchNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(`${API_URL}/news/list`);

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in fetchNews:", error);
    throw error;
  }
}

export async function markNewsAsImportant(
  id: string,
  isImportant: boolean
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/news/mark_important`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, isImportant }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update news: ${response.status}`);
    }
  } catch (error) {
    console.error("Error in markNewsAsImportant:", error);
    throw error;
  }
}
