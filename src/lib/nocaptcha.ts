import axios from "axios";

export class NoCaptchaClient {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string = "http://api.nocaptcha.io/api/wanda/hcaptcha/universal") {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  /**
   * Solve hCaptcha using NoCaptcha API (Synchronous)
   * @param sitekey The sitekey of the hCaptcha
   * @param pageurl The URL of the page containing the hCaptcha (referer)
   * @param rqdata (Optional) The rqdata for enterprise hCaptcha
   * @param userAgent (Optional) The User-Agent of the browser
   * @returns The solution (generated_pass_UUID)
   */
  async solveHCaptcha(sitekey: string, pageurl: string, rqdata?: string, userAgent?: string) {
    try {
      const body: any = {
        sitekey: sitekey,
        referer: pageurl,
      };

      let targetUrl = this.apiUrl;

      if (rqdata) {
        body.rqdata = rqdata;
        // We will NOT force switch to enterprise here. 
        // Let the user configuration or the default URL decide.
        // Some sitekeys work on Universal even with rqdata, or the API handles it.
        // If the user specifically wants enterprise, they should provide the enterprise URL.
      }

      if (userAgent) {
        body.userAgent = userAgent;
        // Some APIs might use different casing or field names, adding common ones just in case
        body.user_agent = userAgent; 
      }

      const response = await axios.post(
        targetUrl,
        body,
        {
          headers: {
            "User-Token": this.apiKey,
            "Content-Type": "application/json",
          },
          timeout: 60000, // 60s timeout for solving
        }
      );

      // Log the request for debugging
      console.log(`[NoCaptcha] Request: URL=${targetUrl}, Body=${JSON.stringify(body)}`);

      const data = response.data;

      if (data.status === 1) {
        return data.data.generated_pass_UUID;
      } else {
        throw new Error(data.msg || "Failed to solve captcha");
      }
    } catch (error: any) {
      throw new Error(`NoCaptcha solve error: ${error.message}`);
    }
  }
}
