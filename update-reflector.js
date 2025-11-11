import fs from "fs";
import fetch from "node-fetch";

const OUTPUT_FILE = "reflector.json";

// Use a public proxy that allows server-to-server GitHub requests
const FEED_URL =
  "https://api.allorigins.workers.dev/raw?url=https://alabamareflector.com/feed/";

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

    const xml = await res.text();

    // Very light XML parsing
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 9)
      .map((match) => {
        const item = match[1];
        const extract = (tag) =>
          (item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] || "")
            .replace(/<!\[CDATA\[|\]\]>/g, "")
            .trim();
        const title = extract("title");
        const link = extract("link");
        const desc = extract("description");
        const img =
          desc.match(/<img[^>]+src=["'](.*?)["']/)?.[1] ||
          "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png";
        return {
          title,
          link,
          thumbnail: img,
          description: desc.replace(/<[^>]*>?/gm, "").substring(0, 250)
        };
      });

    if (!items.length) throw new Error("No items found in RSS feed.");

    const data = {
      status: "ok",
      feed: {
        title: "Alabama Reflector",
        link: "https://alabamareflector.com/",
        description: "Clarity today for a better tomorrow",
        image:
          "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png"
      },
      items
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log("✅ reflector.json updated successfully!");
  } catch (err) {
    console.error("❌ Error updating reflector.json:", err.message);
    process.exit(1);
  }
}

updateReflector();