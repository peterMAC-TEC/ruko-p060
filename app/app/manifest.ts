import type { MetadataRoute } from "next";

// Makes Ruko installable on a phone's home screen (a real app icon, full screen) and puts "Ruko" in the Share sheet,
// so a suspicious message or call transcript can be sent straight to the check from any other app (Android Chrome).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ruko: stop and check",
    short_name: "Ruko",
    description: "When someone pressures you on a call, Ruko helps you pause, check, and bring in someone you trust.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#171717",
    lang: "en-IN",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Is this a scam?", short_name: "Check", url: "/check", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Talk to Ruko", short_name: "Talk", url: "/companion", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
    share_target: {
      action: "/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
