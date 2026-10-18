
const publicArtGrid = document.getElementById("art-grid");
const publicGalleryMessage =
  document.getElementById("public-gallery-message");

async function loadPublicArtwork() {
  if (!publicArtGrid || !publicGalleryMessage) {
    console.error("Gallery HTML elements were not found.");
    return;
  }

  publicGalleryMessage.textContent = "Connecting to artwork gallery...";

  try {
    if (typeof supabaseClient === "undefined") {
      throw new Error(
        "Supabase did not initialize. Check the Supabase script and connection."
      );
    }

    const { data: artworks, error } = await supabaseClient
      .from("artworks")
      .select(
        "id, title, description, category, image_url, image_path, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    publicArtGrid.replaceChildren();

    if (!artworks || artworks.length === 0) {
      publicGalleryMessage.textContent =
        "No artwork was returned. Check your table and permissions.";
      return;
    }

    for (const [index, art] of artworks.entries()) {
      const card = document.createElement("article");
      card.className = "art-card";
      card.dataset.category = (art.category || "other").toLowerCase();

      const imageButton = document.createElement("button");
      imageButton.type = "button";
      imageButton.className = "art-image";
      imageButton.dataset.title = art.title || "Untitled";
      imageButton.dataset.description = art.description || "";

      const img = document.createElement("img");
      img.alt = art.title || "Artwork";
      img.loading = "lazy";

      // FIX: Generate the image URL using the stored Storage path.
      if (art.image_path) {
        const { data } = supabaseClient.storage
          .from("artworks")
          .getPublicUrl(art.image_path);

        console.log("Artwork title:", art.title);
        console.log("Stored image path:", art.image_path);
        console.log("Generated image URL:", data.publicUrl);

        img.src = data.publicUrl;
      } else if (art.image_url) {
        console.log("Using saved image URL:", art.image_url);
        img.src = art.image_url;
      } else {
        console.error("No image path or URL for:", art.title);
      }

      img.onerror = () => {
        console.error("Image failed to load:", art.title, img.src);
        img.alt = "Image could not be loaded: " + (art.title || "Artwork");
      };

      const overlay = document.createElement("span");
      overlay.className = "image-overlay";
      overlay.textContent = "Take a closer look ↗";

      imageButton.append(img, overlay);

      const meta = document.createElement("div");
      meta.className = "art-meta";

      const details = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = art.title || "Untitled";

      const description = document.createElement("p");
      description.textContent =
        art.description || art.category || "Artwork";

      details.append(title, description);

      const number = document.createElement("span");
      number.textContent = `♡ ${String(index + 1).padStart(2, "0")}`;

      meta.append(details, number);
      card.append(imageButton, meta);
      publicArtGrid.append(card);
    }

    publicGalleryMessage.textContent = "";
  } catch (error) {
    console.error("Public gallery failed:", error);
    publicGalleryMessage.textContent =
      "Gallery error: " +
      (error.message || "Could not connect to Supabase.");
  }
}

loadPublicArtwork();
