import fs from "fs";
import fetch from "node-fetch";

const OUTPUT_FILE = "reflector.json";
// Using feed2json.org — a reliable RSS → JSON converter that works with GitHub Actions
const FEED_URL = "https://feed2json.org/convert?url=https://alabamareflector.com/feed/";

async function updateReflector() {
  console.log("📰 Fetching latest posts from Alabama Reflector…");

  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`Failed to fetch RSS feed: ${res.status}`);
    const data = await res.json();

    if (!data.items || data.items.length === 0)
      throw new Error("No items found in RSS feed.");

    // Prepare simplified structure
    const cleanFeed = {
      status: "ok",
      feed: {
        title: data.title || "Alabama Reflector",
        link: data.home_page_url || "https://alabamareflector.com/",
        description:
          data.description || "Clarity today for a better tomorrow",
        image:
          data.icon ||
          "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png"
      },
      items: data.items.slice(0, 9).map((item) => ({
        title: item.title || "Untitled",
        link: item.url || "",
        thumbnail:
          (item._image && item._image.url) ||
          (item.image && item.image.url) ||
          "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png",
        description:
          (item.summary || item.content_text || "")
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