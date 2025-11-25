import { IP2Location } from "ip2location-nodejs";
import path from "path";
import fs from "fs";

let dbInstance: any = null;
const DB_PATH = path.join(process.cwd(), "data", "IP2LOCATION.BIN");

export function getDbPath() {
  return DB_PATH;
}

export function isDbExists() {
  return fs.existsSync(DB_PATH);
}

export function getIpInfo(ip: string) {
  try {
    if (!dbInstance) {
      if (!fs.existsSync(DB_PATH)) {
        return null;
      }
      dbInstance = new IP2Location();
      dbInstance.open(DB_PATH);
    }
    return dbInstance.getAll(ip);
  } catch (error) {
    console.error("IP2Location lookup error:", error);
    return null;
  }
}
