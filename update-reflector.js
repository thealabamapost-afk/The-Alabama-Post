// update-reflector.js
// This script fetches Alabama Reflector news and updates reflector.json automatically.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// File location setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Alabama Reflector WordPress API endpoint
const API_URL = "https://alabamareflector.com/wp-json/wp/v2/posts?per_page=9&_embed";

// Default image (used when an article has no thumbnail)
const FALLBACK_IMAGE =
  "https://alabamareflector.com/wp-content/uploads/2023/07/Alabama-Reflector-logo.png";

// Strip HTML tags from text
function stripHtml(html) {
  return html ? html.replace(/<[^>]*>?/gm, "").trim() : "";
}

// Fetch posts from Alabama Reflector
async function fetchPosts() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}

// Map API response to JSON structure for reflector.json
function mapPostsToItems(posts) {
  return posts.map((post) => {
    const title = stripHtml(post.title?.rendered);
    const link = post.link;
    let thumbnail = FALLBACK_IMAGE;

    // Try to get featured image if available
    try {
      const media = post._embedded?.["wp:featuredmedia"]?.[0];
      if (media?.source_url) thumbnail = media.source_url;
    } catch {
      thumbnail = FALLBACK_IMAGE;
    }

    const description = stripHtml(post.excerpt?.rendered || "");

    return { title, link, thumbnail, description };
  });
}

// Main function
async function main() {
  console.log("🔄 Fetching latest posts from Alabama Reflector…");

  try {
    const posts = await fetchPosts();
    const items = mapPostsToItems(posts);

    const data = {
      status: "ok",
      feed: {
        title: "Alabama Reflector",
        link: "https://alabamareflector.com/",
        description: "Clarity today for a better tomorrow",
        image: FALLBACK_IMAGE,
      },
      items,
    };

    // Write to reflector.json
    fs.writeFileSync(
      path.join(__dirname, "reflector.json"),
      JSON.stringify(data, null, 2),
      "utf8"
    );

    console.log(`✅ reflector.json updated with ${items.length} stories`);
  } catch (err) {
    console.error("❌ Error updating reflector.json:", err);
    process.exit(1);
  }
}

// Run it
main();
