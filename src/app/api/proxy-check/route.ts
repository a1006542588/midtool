import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { getIpInfo } from "@/lib/ip-db";

// Set a timeout for the proxy connection
const TIMEOUT = 10000;

export async function POST(req: NextRequest) {
  try {
    const { proxy } = await req.json();

    if (!proxy) {
      return NextResponse.json({ error: "Proxy is required" }, { status: 400 });
    }

    // Parse proxy string
    // Formats: 
    // ip:port
    // ip:port:user:pass
    // protocol://ip:port
    // protocol://user:pass@ip:port
    
    let proxyUrl = proxy;
    
    // Basic normalization if protocol is missing
    if (!proxyUrl.includes("://")) {
        // Heuristic: if it looks like ip:port or ip:port:user:pass
        const parts = proxyUrl.split(":");
        if (parts.length === 2) {
            // Default to http if unsure, or use what's passed in body if we add that param later
            // For now, we assume the frontend sends the full protocol or we default to http
            proxyUrl = `http://${proxyUrl}`;
        } else if (parts.length === 4) {
            // ip:port:user:pass -> http://user:pass@ip:port
            const user = encodeURIComponent(parts[2]);
            const pass = encodeURIComponent(parts[3]);
            proxyUrl = `http://${user}:${pass}@${parts[0]}:${parts[1]}`;
        } else {
             // Default to http if unsure
             proxyUrl = `http://${proxyUrl}`;
        }
    }

    // Force Remote DNS for SOCKS proxies to improve success rate
    // socks5 -> socks5h (Remote DNS)
    // socks4 -> socks4a (Remote DNS)
    if (proxyUrl.startsWith("socks5://")) {
        proxyUrl = proxyUrl.replace("socks5://", "socks5h://");
    } else if (proxyUrl.startsWith("socks4://")) {
        proxyUrl = proxyUrl.replace("socks4://", "socks4a://");
    }

    let agent;
    if (proxyUrl.startsWith("socks")) {
      // socks-proxy-agent supports socks:// (v5), socks5://, socks4://
      agent = new SocksProxyAgent(proxyUrl);
    } else {
      // For HTTP targets (ip-api.com is http), use HttpProxyAgent for http proxies
      // HttpsProxyAgent is for HTTPS targets (it uses CONNECT method)
      // Since our target is http://ip-api.com, we should use HttpProxyAgent
      agent = new HttpProxyAgent(proxyUrl);
    }

    const startTime = Date.now();

    // Use lang=zh-CN for Chinese results
    let responseData: any = {};
    let latency = 0;
    let fetchError = null;

    try {
        const response = await axios.get("http://ip-api.com/json/?lang=zh-CN&fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting", {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: TIMEOUT,
            validateStatus: () => true,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        
        const endTime = Date.now();
        latency = endTime - startTime;

        if (response.data.status === "success") {
            responseData = response.data;
        } else {
            fetchError = response.data.message;
        }
    } catch (e: any) {
        fetchError = e.message;
        throw new Error(`Proxy connection failed: ${e.message}`);
    }

    // Enrich with Local DB if available (Fallback or verification)
    const localInfo = responseData.query ? getIpInfo(responseData.query) : null;
    
    const finalData = {
        ip: responseData.query,
        country: responseData.country || localInfo?.countryLong, // Prefer API Chinese result
        city: responseData.city || localInfo?.city,
        isp: responseData.isp, 
        latency,
        isProxy: responseData.proxy,
        isHosting: responseData.hosting,
        isMobile: responseData.mobile,
        timezone: responseData.timezone || localInfo?.timeZone
    };

    return NextResponse.json({
      success: true,
      data: finalData
    });

  } catch (error: any) {
    console.error("Proxy check error:", error.message);
    return NextResponse.json({ 
        success: false, 
        error: error.message || "Connection failed" 
    }, { status: 200 });
  }
}
