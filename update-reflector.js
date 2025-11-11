import fs from "fs";
import fetch from "node-fetch";

const OUTPUT_FILE = "reflector.json";

// Using a permanent proxy mirror that fetches the RSS feed outside GitHub’s IP range
const FEED_URL =
  "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Falabamareflector.com%2Ffeed%2F";

async function updateReflector() {
  console.log("📰 Fetching latest posts from Alabama Reflector…");

  try {
    const res = await fetch(FEED_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok)
      throw new Error(`Failed to fetch RSS feed: HTTP ${res.status}`);

    const data = await res.json();

    if (!data.items || data.items.length === 0)
      throw new Error("No items found in the RSS feed.");

    const feedData = {
      status: "ok",
      feed: {
        title: data.feed?.title || "Alabama Reflector",
        link: data.feed?.link || "https://alabamareflector.com/",
        description:
          data.feed?.description || "Clarity today for a better tomorrow",
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

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(feedData, null, 2));
    console.log("✅ reflector.json updated successfully!");
  } catch (err) {
    console.error("❌ Error updating reflector.json:", err.message);
    process.exit(1);
  }
}

updateReflector();