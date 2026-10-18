
const publicArtGrid = document.getElementById("art-grid");
const publicGalleryMessage = document.getElementById(
  "public-gallery-message"
);

async function loadPublicArtwork() {
  if (!publicArtGrid || !publicGalleryMessage) {
    console.error("Gallery HTML elements were not found.");
    return;
  }

  publicGalleryMessage.textContent = "Connecting to artwork gallery...";

  try {
    if (typeof supabaseClient === "undefined") {
      throw new Error(
        "Supabase did not initialize. Check your Supabase scripts."
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
      publicGalleryMessage.textContent = "No artwork found yet.";
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
      imageButton.setAttribute(
        "aria-label",
        `Take a closer look at ${art.title || "artwork"}`
      );

      const img = document.createElement("img");
      img.alt = art.title || "Artwork";
      img.loading = "lazy";

      // Load the artwork image from Supabase Storage.
      if (art.image_path) {
        const { data } = supabaseClient.storage
          .from("artworks")
          .getPublicUrl(art.image_path);

        img.src = data.publicUrl;
      } else if (art.image_url) {
        img.src = art.image_url;
      }

      img.onerror = () => {
        console.error("Image failed to load:", art.title, img.src);
      };

      const overlay = document.createElement("span");
      overlay.className = "image-overlay";
      overlay.textContent = "Take a closer look ↗";

      imageButton.append(img, overlay);

      // Open a large artwork preview when clicked.
      imageButton.addEventListener("click", () => {
        // Prevent duplicate previews.
        if (document.querySelector(".art-preview-modal")) return;

        const preview = document.createElement("div");
        preview.className = "art-preview-modal";
        preview.setAttribute("role", "dialog");
        preview.setAttribute("aria-modal", "true");
        preview.setAttribute(
          "aria-label",
          art.title || "Artwork preview"
        );

        Object.assign(preview.style, {
          position: "fixed",
          inset: "0",
          background: "rgba(0, 0, 0, 0.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "24px",
          boxSizing: "border-box",
          overflowY: "auto",
          zIndex: "99999",
          cursor: "zoom-out"
        });

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.textContent = "✕ Close";
        closeButton.setAttribute("aria-label", "Close artwork preview");

        Object.assign(closeButton.style, {
          position: "absolute",
          top: "18px",
          right: "20px",
          padding: "10px 16px",
          border: "1px solid rgba(255,255,255,0.4)",
          borderRadius: "8px",
          background: "#222",
          color: "#fff",
          fontSize: "15px",
          cursor: "pointer"
        });

        const largeImage = document.createElement("img");
        largeImage.src = img.src;
        largeImage.alt = art.title || "Artwork preview";

        Object.assign(largeImage.style, {
          display: "block",
          maxWidth: "90vw",
          maxHeight: "75vh",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          borderRadius: "8px",
          cursor: "default"
        });

        const caption = document.createElement("h2");
        caption.textContent = art.title || "Untitled";

        Object.assign(caption.style, {
          color: "#fff",
          margin: "16px 0 8px",
          textAlign: "center"
        });

        const description = document.createElement("p");
        description.textContent = art.description || "";

        Object.assign(description.style, {
          color: "#ddd",
          maxWidth: "650px",
          margin: "0 0 16px",
          textAlign: "center",
          lineHeight: "1.6"
        });

        function closePreview() {
          preview.remove();
          document.removeEventListener("keydown", handleEscape);
          imageButton.focus();
        }

        function handleEscape(event) {
          if (event.key === "Escape") {
            closePreview();
          }
        }

        closeButton.addEventListener("click", (event) => {
          event.stopPropagation();
          closePreview();
        });

        largeImage.addEventListener("click", (event) => {
          event.stopPropagation();
        });

        caption.addEventListener("click", (event) => {
          event.stopPropagation();
        });

        description.addEventListener("click", (event) => {
          event.stopPropagation();
        });

        preview.addEventListener("click", closePreview);
        document.addEventListener("keydown", handleEscape);

        preview.append(
          closeButton,
          largeImage,
          caption,
          description
        );

        document.body.appendChild(preview);
        closeButton.focus();
      });

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
