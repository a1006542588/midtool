import { DiscordLoginFunctional } from "@/components/tools/DiscordLoginFunctional";
import { DiscordLoginDownload } from "@/components/tools/DiscordLoginDownload";

export const dynamic = 'force-dynamic';

export default function DiscordLoginPage() {
  // Check for standalone mode via runtime environment variable
  // This allows the same build to serve both roles depending on how it's started
  const isStandalone = process.env.APP_MODE === 'standalone';
  
  // Also support build-time flag for local dev
  const isLocalDev = process.env.NEXT_PUBLIC_APP_MODE === 'local';

  if (isStandalone || isLocalDev) {
    return <DiscordLoginFunctional />;
  }
  
  return <DiscordLoginDownload />;
}
