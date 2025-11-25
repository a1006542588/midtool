import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import axios from "axios";
import AdmZip from "adm-zip";
import { getDbPath } from "@/lib/ip-db";

export async function POST(req: NextRequest) {
  try {
    // Hardcoded token as requested
    const token = "44o4BJ7ZqDVFSrAelwkVoW8ZFX3T4m2ZDM7wTzdU2RK4kr7nLqpJsHcHQ2sRaSgF";

    // DB11LITEBIN contains Country, Region, City, Lat, Lon, Zip, Timezone
    const downloadCode = "DB11LITEBIN"; 
    const url = `https://www.ip2location.com/download/?token=${token}&file=${downloadCode}`;

    console.log("Downloading IP database...");
    
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "arraybuffer",
    });

    if (response.status !== 200) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    // Check if it's a zip file (magic bytes PK..)
    const data = response.data;
    if (data[0] !== 0x50 || data[1] !== 0x4b) {
        // If not zip, it might be an error message text
        const text = Buffer.from(data).toString();
        if (text.includes("NO PERMISSION")) {
             return NextResponse.json({ error: "Invalid Token or No Permission" }, { status: 403 });
        }
        if (text.includes("LIMIT EXCEEDED")) {
             return NextResponse.json({ error: "Download Limit Exceeded" }, { status: 429 });
        }
    }

    console.log("Extracting database...");
    const zip = new AdmZip(data);
    const zipEntries = zip.getEntries();

    let binEntry = null;
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith(".BIN")) {
        binEntry = entry;
        break;
      }
    }

    if (!binEntry) {
      return NextResponse.json({ error: "No .BIN file found in the downloaded archive" }, { status: 500 });
    }

    const dbPath = getDbPath();
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(dbPath, binEntry.getData());

    return NextResponse.json({ success: true, message: "Database updated successfully" });

  } catch (error: any) {
    console.error("Update DB error:", error);
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}
