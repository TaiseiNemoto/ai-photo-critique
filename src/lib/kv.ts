export interface CritiqueData {
  id: string;
  filename: string;
  uploadedAt: string;
  technique: string;
  composition: string;
  color: string;
  overall?: string;
  imageData: string;
  exifData: Record<string, unknown>;
  shareId: string;
  createdAt: string;
  expiresAt: string;
}

// 開発時用のインメモリストレージ
class MemoryStorage {
  private storage = new Map<string, string>();
  private expirations = new Map<string, number>();

  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.storage.set(key, value);
    this.expirations.set(key, Date.now() + seconds * 1000);
  }

  async get(key: string): Promise<string | null> {
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.storage.delete(key);
      this.expirations.delete(key);
      return null;
    }
    return this.storage.get(key) || null;
  }

  async del(key: string): Promise<void> {
    this.storage.delete(key);
    this.expirations.delete(key);
  }
}

type KvInterface = {
  setex(key: string, seconds: number, value: string): Promise<string | void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number | void>;
};

class KvClient {
  private client: KvInterface;
  private isProduction: boolean;

  constructor() {
    // 本番環境ではUpstash Redisを使用、開発時はインメモリストレージを使用
    this.isProduction = !!(
      process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    );

    if (this.isProduction) {
      // 動的インポートでUpstash Redisを使用（本番環境のみ）
      this.client = null as unknown as KvInterface; // 後で初期化
    } else {
      // 開発時用のインメモリストレージ
      this.client = new MemoryStorage();
    }
  }

  private async getClient() {
    if (this.isProduction && !this.client) {
      const { Redis } = await import("@upstash/redis");
      this.client = new Redis({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!,
      });
    }
    return this.client;
  }

  // 批評データの保存（24時間TTL）
  async saveCritique(data: CritiqueData): Promise<void> {
    const client = await this.getClient();
    const key = `critique:${data.id}`;
    await client.setex(key, 24 * 60 * 60, JSON.stringify(data));
  }

  // 批評データの取得
  async getCritique(id: string): Promise<CritiqueData | null> {
    const client = await this.getClient();
    const key = `critique:${id}`;
    const data = await client.get(key);

    if (!data) return null;

    // Upstash Redis の場合、データが既にパースされて返される場合がある
    if (typeof data === "string") {
      return JSON.parse(data);
    } else if (typeof data === "object") {
      return data as CritiqueData;
    }

    return null;
  }

  // 注意: 以下の関数は画像データ重複保存解消のため削除
  // - saveImage() : 単独の画像保存は不要（CritiqueDataに統合）
  // - saveUpload() : アップロードデータ保存は不要（講評時に統合）
  // - getUpload() : アップロードデータ取得は不要
  // - getImage() : 単独の画像取得は不要（CritiqueDataから取得）

  // データの削除
  async delete(key: string): Promise<void> {
    const client = await this.getClient();
    await client.del(key);
  }

  // 接続テスト
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const testKey = "test:connection";
      const testValue = "OK";

      // 書き込みテスト
      await client.setex(testKey, 60, testValue);

      // 読み込みテスト
      const result = await client.get(testKey);

      // クリーンアップ
      await client.del(testKey);

      return result === testValue;
    } catch (error) {
      console.error("KV接続テストに失敗:", error);
      return false;
    }
  }

  // ランダムなIDの生成
  generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}

// シングルトンインスタンス
export const kvClient = new KvClient();
