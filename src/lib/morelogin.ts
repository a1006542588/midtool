import crypto from "crypto";

// Default MoreLogin Local API URL
const DEFAULT_API_URL = "http://127.0.0.1:40000";

export class MoreLoginClient {
  private apiUrl: string;
  private appId?: string;
  private secretKey?: string;

  constructor(apiUrl: string = DEFAULT_API_URL, appId?: string, secretKey?: string) {
    this.apiUrl = apiUrl;
    this.appId = appId;
    this.secretKey = secretKey;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.appId && this.secretKey) {
      const nonceId = `${Date.now()}:${crypto.randomUUID()}`;
      const signatureStr = `${this.appId}${nonceId}${this.secretKey}`;
      const signature = crypto.createHash('md5').update(signatureStr).digest('hex');

      headers["X-Api-Id"] = this.appId;
      headers["X-Nonce-Id"] = nonceId;
      headers["Authorization"] = signature;
    }
    return headers;
  }

  private async request(endpoint: string, method: string, body?: any, useAuth: boolean = true) {
    const headers = useAuth ? this.getHeaders() : { "Content-Type": "application/json" };
    const url = `${this.apiUrl}${endpoint}`;
    const bodyStr = body ? JSON.stringify(body) : undefined;
    
    console.log(`[MoreLogin] ${method} ${url} (Auth: ${useAuth})`);
    if (bodyStr) console.log(`[MoreLogin] Payload: ${bodyStr}`);

    try {
      // Add timeout to fetch to prevent hanging
      const controller = new AbortController();
      // Increase timeout to 30s to handle high concurrency or slow local API response
      const timeoutId = setTimeout(() => controller.abort(), 30000); 

      const response = await fetch(url, {
        method,
        headers,
        body: bodyStr,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const text = await response.text();
      console.log(`[MoreLogin] Response: ${text.substring(0, 200)}...`); // Log first 200 chars

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // If response is not JSON, throw error with text
        throw new Error(`Invalid JSON response from MoreLogin: ${text}`);
      }

      return data;
    } catch (error: any) {
      console.error(`[MoreLogin] Request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start a browser profile
   */
  async startProfile(profileId: string) {
    // 0. Check status first (New API)
    try {
        console.log(`[MoreLogin] Checking status for ${profileId}...`);
        const statusRes = await this.request('/api/env/status', 'POST', { envId: profileId });
        if (statusRes.code === 0 && statusRes.data) {
             const status = statusRes.data.status || statusRes.data.localStatus;
             if (status === 'running') {
                 console.log(`[MoreLogin] Profile ${profileId} is already running.`);
                 return await this._processStartResponse(statusRes.data, profileId);
             }
        }
    } catch (e) {
        console.warn("[MoreLogin] Status check failed, proceeding to start...", e);
    }

    const strategies: { endpoint: string; payload: any; auth: boolean }[] = [
      // Strategy 1: Old API /api/v1/profile/start (String ID) - Prioritize this as it works for the user
      { endpoint: '/api/v1/profile/start', payload: { ids: profileId, headless: false }, auth: true },
      // Strategy 2: New API /api/env/start (Standard)
      { endpoint: '/api/env/start', payload: { envId: profileId, isHeadless: false }, auth: true },
      // Strategy 3: New API /api/env/start (No Auth)
      { endpoint: '/api/env/start', payload: { envId: profileId, isHeadless: false }, auth: false },
      // Strategy 4: Old API /api/v1/profile/start (Array ID)
      { endpoint: '/api/v1/profile/start', payload: { ids: [profileId], headless: false }, auth: true },
      // Strategy 5: Old API /api/v1/profile/start (No Auth)
      { endpoint: '/api/v1/profile/start', payload: { ids: [profileId], headless: false }, auth: false },
    ];

    // If profileId is numeric, add uniqueId strategies
    if (/^\d+$/.test(profileId)) {
        // Use string for uniqueId to avoid precision loss if the API supports it, 
        // otherwise we have to accept the risk or use a library like json-bigint if we were parsing it,
        // but here we are sending it. 
        // However, JSON.stringify will treat a large number as a number if we pass it as a number.
        // If we pass it as a string, the API might reject it if it expects a number.
        // The issue in the logs was: Payload: {"uniqueId":1993385065120866300,...}
        // This means `parseInt` lost precision.
        // Let's try passing it as a string first if the API supports it, or just rely on envId which works.
        
        // Actually, since envId strategy works (it's a string), we should prioritize envId strategies.
        // The current order puts envId strategies first.
        // The log showed uniqueId strategies failing with "Http message not readable", likely due to type mismatch or precision.
        // We should probably remove the uniqueId strategies if envId works, or move them to the end.
        // Or better, don't use parseInt.
        
        // const uid = parseInt(profileId, 10); // <--- This causes precision loss for large IDs
        // strategies.unshift(
        //    { endpoint: '/api/env/start', payload: { uniqueId: uid, isHeadless: false }, auth: true },
        //    { endpoint: '/api/env/start', payload: { uniqueId: uid, isHeadless: false }, auth: false }
        // );
    }

    const errors: string[] = [];

    for (const strategy of strategies) {
      try {
        // Skip auth strategies if no keys provided
        if (strategy.auth && (!this.appId || !this.secretKey)) continue;

        console.log(`[MoreLogin] Trying start strategy: ${strategy.endpoint} (Auth: ${strategy.auth}) Payload: ${JSON.stringify(strategy.payload)}`);
        const res = await this.request(strategy.endpoint, 'POST', strategy.payload, strategy.auth);
        
        if (res.code === 0) {
          console.log(`[MoreLogin] Strategy succeeded: ${strategy.endpoint}`);
          return await this._processStartResponse(res.data, profileId);
        } else {
          const msg = `Strategy ${strategy.endpoint} (Auth: ${strategy.auth}) failed: ${JSON.stringify(res)}`;
          console.warn(`[MoreLogin] ${msg}`);
          errors.push(msg);
        }
      } catch (e: any) {
        const msg = `Strategy ${strategy.endpoint} (Auth: ${strategy.auth}) error: ${e.message}`;
        console.warn(`[MoreLogin] ${msg}`);
        errors.push(msg);
      }
    }

    throw new Error(`Failed to start profile after ${strategies.length} attempts.\nErrors:\n${errors.join('\n')}`);
  }

  private async _processStartResponse(data: any, profileId: string) {
    // Handle different response structures
    let targetData = data;
    
    // If data is keyed by profileId (Old API style sometimes)
    if (data && data[profileId]) {
      targetData = data[profileId];
    }

    // Normalize port
    const port = targetData.debugPort || targetData.port;
    
    if (port) {
      try {
        const versionRes = await fetch(`http://127.0.0.1:${port}/json/version`);
        const versionData = await versionRes.json();
        return {
          wsEndpoint: versionData.webSocketDebuggerUrl,
          port: port,
          ...targetData
        };
      } catch (e) {
        console.warn("[MoreLogin] Failed to get WebSocket URL from debug port:", e);
        return { port, ...targetData };
      }
    }
    return targetData;
  }

  /**
   * Stop a browser profile
   */
  async stopProfile(profileId: string) {
    const strategies: { endpoint: string; payload: any; auth: boolean }[] = [
      // Strategy 1: Old API /api/v1/profile/stop (String ID) - Prioritize
      { endpoint: '/api/v1/profile/stop', payload: { ids: profileId }, auth: true },
      // Strategy 2: New API /api/env/close (Correct endpoint per docs)
      { endpoint: '/api/env/close', payload: { envId: profileId }, auth: true },
      // Strategy 3: New API /api/env/close (No Auth)
      { endpoint: '/api/env/close', payload: { envId: profileId }, auth: false },
      // Strategy 4: Old API /api/v1/profile/stop (Array ID)
      { endpoint: '/api/v1/profile/stop', payload: { ids: [profileId] }, auth: true },
    ];

    for (const s of strategies) {
      try {
        const res = await this.request(s.endpoint, 'POST', s.payload, s.auth);
        if (res.code === 0) {
          console.log(`[MoreLogin] Profile ${profileId} stopped successfully.`);
          return true;
        }
      } catch (e: any) {
        // If 404, it means the profile is likely already stopped or doesn't exist
        if (e.message && e.message.includes("404")) {
             console.log(`[MoreLogin] Profile ${profileId} stop returned 404 (likely already stopped).`);
             return true;
        }
        // Continue to next strategy
      }
    }
    
    console.warn(`[MoreLogin] Failed to stop profile ${profileId} with all strategies.`);
    return false;
  }
  
  /**
   * Check if MoreLogin is running
   */
  async checkHealth() {
    try {
      // Try listing 1 item
      const res = await this.request('/api/env/page', 'POST', { pageNo: 1, pageSize: 1 });
      return res.code === 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get profile list
   */
  async getProfileList(page: number = 1, pageSize: number = 100) {
    try {
      // Try New API
      const res = await this.request('/api/env/page', 'POST', { pageNo: page, pageSize: pageSize });
      if (res.code === 0) {
        return res.data.dataList || [];
      }
    } catch (e) {
      console.warn("[MoreLogin] /api/env/page failed, trying old API...");
    }

    try {
      // Try Old API
      const url = `/api/v1/profile/list?page=${page}&page_size=${pageSize}`;
      const res2 = await this.request(url, 'GET');
      
      if (res2.code === 0) {
        return res2.data.list || [];
      }
    } catch (e) {
       console.error("MoreLogin getProfileList error:", e);
    }
    
    return [];
  }
}
