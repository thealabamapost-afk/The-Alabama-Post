import fs from "fs";
import fetch from "node-fetch";

const OUTPUT_FILE = "reflector.json";
const FEED_URL = "https://twilight-dawn-a4d1.pinoonip23.workers.dev/"; // your Cloudflare Worker feed proxy

async function updateReflector() {
  console.log("📰 Fetching latest posts from Alabama Reflector…");

  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status}`);
    const text = await res.text();

    // Parse RSS XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const items = xmlDoc.querySelectorAll("item");

    const posts = Array.from(items).slice(0, 10).map((item) => ({
      title: item.querySelector("title")?.textContent.trim() || "Untitled",
      link: item.querySelector("link")?.textContent.trim() || "",
      description:
        item.querySelector("description")?.textContent.trim().replace(/<[^>]+>/g, "").slice(0, 200) +
          "..." || "",
      thumbnail: item.querySelector("media\\:content, enclosure")?.getAttribute("url") || "",
    }));

    const data = {
      status: "ok",
      feed: {
        title: "Alabama Reflector",
        link: "https://alabamareflector.com/",
        description: "Clarity today for a better tomorrow",
        image: "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png",
      },
      items: posts,
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log("✅ reflector.json updated successfully!");
  } catch (err) {
    console.error("❌ Error updating reflector.json:", err.message);
    process.exit(1);
  }
}

updateReflector();