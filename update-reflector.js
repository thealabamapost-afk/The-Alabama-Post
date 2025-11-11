import fs from "fs";
import fetch from "node-fetch";

const OUTPUT_FILE = "reflector.json";

// Try AllOrigins proxy first (works for most GitHub runners)
const FEED_URL = "https://api.allorigins.win/raw?url=https://alabamareflector.com/feed/";

async function updateReflector() {
  console.log("📰 Fetching latest posts from Alabama Reflector…");

  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`Failed to fetch RSS feed: ${res.status}`);

    const text = await res.text();

    // Extract <item> blocks manually (simple RSS parsing)
    const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 9).map(match => {
      const item = match[1];
      const title = (item.match(/<title>(.*?)<\/title>/)?.[1] || "Untitled").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      const link = (item.match(/<link>(.*?)<\/link>/)?.[1] || "").trim();
      const desc = (item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      const imgMatch = desc.match(/<img.*?src=["'](.*?)["']/);
      const thumbnail = imgMatch ? imgMatch[1] : "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png";

      return {
        title,
        link,
        thumbnail,
        description: desc.replace(/(<([^>]+)>)/gi, "").substring(0, 250)
      };
    });

    if (!items.length) throw new Error("No items found in RSS feed.");

    const jsonOutput = {
      status: "ok",
      feed: {
        title: "Alabama Reflector",
        link: "https://alabamareflector.com/",
        description: "Clarity today for a better tomorrow",
        image: "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png"
      },
      items
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jsonOutput, null, 2));
    console.log("✅ reflector.json updated successfully!");
  } catch (err) {
    console.error("❌ Error updating reflector.json:", err.message);
    process.exit(1);
  }
}

updateReflector();