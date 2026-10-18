
const publicArtGrid = document.getElementById("art-grid");
const publicGalleryMessage =
  document.getElementById("public-gallery-message");

async function loadPublicArtwork() {
  publicGalleryMessage.textContent = "Loading artwork...";

  const { data: artworks, error } = await supabaseClient
    .from("artworks")
    .select("id, title, description, category, image_url, image_path, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Public gallery error:", error);
    publicGalleryMessage.textContent =
      "Unable to load artwork. Please try again later.";
    return;
  }

  publicArtGrid.replaceChildren();

  if (!artworks || artworks.length === 0) {
    publicGalleryMessage.textContent = "No artwork available yet.";
    return;
  }

  publicGalleryMessage.textContent = "";

  artworks.forEach((art, index) => {
    const card = document.createElement("article");
    card.className = "art-card";
    card.dataset.category = (art.category || "other").toLowerCase();

    const imageButton = document.createElement("button");
    imageButton.type = "button";
    imageButton.className = "art-image";
    imageButton.dataset.title = art.title || "Untitled";
    imageButton.dataset-description = art.description || "";
    imageButton.setAttribute(
      "aria-label",
      `View ${art.title || "artwork"}`
    );

    const image = document.createElement("img");
    image.alt = art.title || "Artwork";
    image.loading = "lazy";

    if (art.image_url) {
      image.src = art.image_url;
    } else if (art.image_path) {
      const { data } = supabaseClient.storage
        .from("artworks")
        .getPublicUrl(art.image_path);

      image.src = data.publicUrl;
    }

    image.onerror = () => {
      console.error("Could not display image:", art.title);
    };

    const overlay = document.createElement("span");
    overlay.className = "image-overlay";
    overlay.textContent = "Take a closer look ↗";

    imageButton.append(image, overlay);

    const meta = document.createElement("div");
    meta.className = "art-meta";

    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = art.title || "Untitled";

    const description = document.createElement("p");
    description.textContent = art.description || art.category || "Artwork";

    details.append(title, description);

    const number = document.createElement("span");
    number.textContent = `♡ ${String(index + 1).padStart(2, "0")}`;

    meta.append(details, number);
    card.append(imageButton, meta);
    publicArtGrid.append(card);
  });
}

loadPublicArtwork();
