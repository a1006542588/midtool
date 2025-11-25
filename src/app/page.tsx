import HomeClient from "@/components/HomeClient";

export const dynamic = 'force-dynamic';

export default function Home() {
  const isStandalone = process.env.APP_MODE === 'standalone';
  return <HomeClient isStandalone={isStandalone} />;
}
