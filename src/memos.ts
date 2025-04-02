/**
 * Memos client used to interact with the Memos API.
 */

// 定义可见性枚举
export enum Visibility {
  PUBLIC = "PUBLIC",
  PROTECTED = "PROTECTED",
  PRIVATE = "PRIVATE"
}

// 定义接口
interface SearchMemosParams {
  keyWord: string;
}

interface CreateMemoParams {
  content: string;
  visibility?: Visibility;
}

interface GetMemoParams {
  name: string;
}

interface UpdateMemoParams {
  name: string;
  content: string;
}

export class MemosClient {
  private readonly baseUrl: string;
  private readonly token: string;

  /**
   * Create a new Memos client.
   * @param baseUrl - The base URL of the Memos API.
   * @param token - The access token for authentication.
   */
  constructor({ baseUrl, token }: { baseUrl: string; token: string }) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async searchMemos({ keyWord }: SearchMemosParams) {
    return this.request(`/api/v1/memos?content_search=${encodeURIComponent(keyWord)}`);
  }

  async createMemo({ content, visibility = Visibility.PRIVATE }: CreateMemoParams) {
    return this.request('/api/v1/memos', {
      method: 'POST',
      body: JSON.stringify({ content, visibility })
    });
  }

  async getMemo({ name }: GetMemoParams) {
    return this.request(`/api/v1/${name}`);
  }

  async updateMemo({ name, content }: UpdateMemoParams) {
    return this.request(`/api/v1/${name}`, {
      method: 'PATCH',
      body: JSON.stringify({ content })
    });
  }
} 