export interface CritiqueData {
  id: string;
  filename: string;
  technique: string;
  composition: string;
  color: string;
  exifData: Record<string, unknown>;
  uploadedAt: string;
}

export interface ShareData {
  id: string;
  critiqueId: string;
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
    // 本番環境ではVercel KVを使用、開発時はインメモリストレージを使用
    this.isProduction = !!(
      process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    );

    if (this.isProduction) {
      // 動的インポートでVercel KVを使用（本番環境のみ）
      this.client = null as unknown as KvInterface; // 後で初期化
    } else {
      // 開発時用のインメモリストレージ
      this.client = new MemoryStorage();
    }
  }

  private async getClient() {
    if (this.isProduction && !this.client) {
      const { kv } = await import("@vercel/kv");
      this.client = kv;
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
    return data ? JSON.parse(data as string) : null;
  }

  // 共有URLデータの保存（24時間TTL）
  async saveShare(data: ShareData): Promise<void> {
    const client = await this.getClient();
    const key = `share:${data.id}`;
    await client.setex(key, 24 * 60 * 60, JSON.stringify(data));
  }

  // 共有URLデータの取得
  async getShare(id: string): Promise<ShareData | null> {
    const client = await this.getClient();
    const key = `share:${id}`;
    const data = await client.get(key);
    return data ? JSON.parse(data as string) : null;
  }

  // 画像データの保存（Base64エンコード済み、24時間TTL）
  async saveImage(id: string, imageData: string): Promise<void> {
    const client = await this.getClient();
    const key = `image:${id}`;
    await client.setex(key, 24 * 60 * 60, imageData);
  }

  // 画像データの取得
  async getImage(id: string): Promise<string | null> {
    const client = await this.getClient();
    const key = `image:${id}`;
    return (await client.get(key)) as string | null;
  }

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
