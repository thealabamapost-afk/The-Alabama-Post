import fs from "fs";
import fetch from "node-fetch";

const OUTPUT_FILE = "reflector.json";

// Reliable proxy that allows GitHub runners to fetch feeds
const PROXY_FEED = "https://api.rss2json.com/v1/api.json?rss_url=https://alabamareflector.com/feed/";

async function updateReflector() {
  console.log("📰 Fetching latest posts from Alabama Reflector…");

  try {
    const res = await fetch(PROXY_FEED, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GitHubFeedBot/1.0; +https://thealabamapost.com)"
      }
    });

    if (!res.ok) throw new Error(`Failed to fetch RSS feed: ${res.status}`);
    const data = await res.json();

    if (!data.items || data.items.length === 0)
      throw new Error("No items found in the RSS feed.");

    // Clean and structure the data
    const cleanFeed = {
      status: "ok",
      feed: {
        title: data.feed?.title || "Alabama Reflector",
        link: data.feed?.link || "https://alabamareflector.com/",
        description: data.feed?.description || "Clarity today for a better tomorrow",
        image:
          data.feed?.image ||
          "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png"
      },
      items: data.items.slice(0, 9).map((item) => ({
        title: item.title,
        link: item.link,
        thumbnail:
          item.thumbnail ||
          "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png",
        description:
          (item.description || "")
            .replace(/(<([^>]+)>)/gi, "")
            .substring(0, 250)
      }))
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleanFeed, null, 2));
    console.log("✅ reflector.json updated successfully!");
  } catch (err) {
    console.error("❌ Error updating reflector.json:", err.message);
    process.exit(1);
  }
}

updateReflector();