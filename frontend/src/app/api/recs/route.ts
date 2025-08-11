import { NextRequest, NextResponse } from "next/server";

type Profile = {
  display_name?: string;
  city?: string;
  country?: string;
  bio?: string;
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const profile: Profile = body?.profile || {};
  const trips = Array.isArray(body?.trips) ? body.trips : [];

  const apiKey = process.env.OPENROUTER_API_KEY;
  const prompt = `You are a travel curator. Based on the user's profile and recent trips, propose:
  - bannerTitle (<=6 words),
  - blurb (<=20 words),
  - topSelections: 6 destination cards with { name, country, reason }, prioritising user's country/region and diverse interests,
  - groupings: array of short headings for grouping filters (eg. Beaches, Mountains, Food, Culture),
  - sortOptions: short strings like 'Trending', 'Budget friendly', 'Weekend trips'.
  Respond as compact JSON with keys: bannerTitle, blurb, topSelections, groupings, sortOptions.`;

  if (apiKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://localhost",
          "X-Title": "GlobalTrotters",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          messages: [
            { role: "system", content: "Return only valid JSON" },
            { role: "user", content: `${prompt}\nProfile: ${JSON.stringify(profile)}\nRecentTrips: ${JSON.stringify(trips)}` },
          ],
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      try {
        const parsed = JSON.parse(text);
        return NextResponse.json(parsed);
      } catch {
        // fall through to fallback
      }
    } catch (e) {
      // ignore and fallback
    }
  }

  // Fallback content without external API
  const city = profile.city || "Bengaluru";
  const country = profile.country || "India";
  return NextResponse.json({
    bannerTitle: `Explore ${country}`,
    blurb: `Handpicked getaways near ${city}`,
    topSelections: [
      { name: "Goa", country: "India", reason: "Beaches and nightlife" },
      { name: "Coorg", country: "India", reason: "Coffee estates & waterfalls" },
      { name: "Udaipur", country: "India", reason: "Lakes and palaces" },
      { name: "Hampi", country: "India", reason: "Ruins and boulders" },
      { name: "Pondicherry", country: "India", reason: "French vibes by the sea" },
      { name: "Munnar", country: "India", reason: "Tea hills & mist" },
    ],
    groupings: ["Beaches", "Hills", "Culture", "Food"],
    sortOptions: ["Trending", "Budget friendly", "Weekend trips"],
  });
}


