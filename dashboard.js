
const uploadForm = document.getElementById("upload-form");
const uploadMessage = document.getElementById("upload-message");
const uploadButton = document.getElementById("upload-button");
const gallery = document.getElementById("my-art-grid");
const galleryMessage = document.getElementById("gallery-message");
const logoutButton = document.getElementById("logout-button");

let currentUser;

async function checkLogin() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.replace("login.html");
    return false;
  }

  currentUser = data.user;
  return true;
}

async function loadArtwork() {
  gallery.replaceChildren();
  galleryMessage.textContent = "Loading your artwork...";

  const { data, error } = await supabaseClient
    .from("artworks")
    .select("*")
    .eq("owner_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    galleryMessage.textContent = "Could not load artwork: " + error.message;
    return;
  }

  galleryMessage.textContent = data.length
    ? ""
    : "You haven't uploaded any artwork yet.";

  for (const art of data) {
    const card = document.createElement("article");
    card.className = "my-art-card";

   const img = document.createElement("img");
img.alt = art.title || "Artwork";
img.loading = "lazy";

if (art.image_path) {
  // First, try the public URL for this storage file.
  const { data } = supabaseClient
    .storage
    .from("artworks")
    .getPublicUrl(art.image_path);

  img.src = data.publicUrl;

  // If the bucket is private, try a temporary signed URL.
  img.onerror = async () => {
    img.onerror = null;

    const { data: signedData, error } = await supabaseClient
      .storage
      .from("artworks")
      .createSignedUrl(art.image_path, 3600);

    if (!error && signedData?.signedUrl) {
      img.src = signedData.signedUrl;
    } else {
      console.error(
        "Could not load artwork image:",
        art.title,
        error
      );
    }
  };
} else if (art.image_url) {
  // Fallback for older artwork records.
  img.src = art.image_url;
}

    const content = document.createElement("div");
    content.className = "my-art-card-content";

    const title = document.createElement("h3");
    title.textContent = art.title;

    const description = document.createElement("p");
    description.textContent = art.description || "";

    const category = document.createElement("p");
    category.textContent = art.category || "Other";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete artwork";

    deleteButton.addEventListener("click", async () => {
      if (!confirm(`Delete "${art.title}"? This cannot be undone.`)) {
        return;
      }

      deleteButton.disabled = true;

      const { error: deleteError } = await supabaseClient
        .from("artworks")
        .delete()
        .eq("id", art.id)
        .eq("owner_id", currentUser.id);

      if (deleteError) {
        alert("Could not delete artwork: " + deleteError.message);
        deleteButton.disabled = false;
        return;
      }

      const prefix = currentUser.id + "/";
      const imagePath = art.image_path;

      if (imagePath && imagePath.startsWith(prefix)) {
        const { error: storageError } = await supabaseClient
          .storage.from("artworks")
          .remove([imagePath]);

        if (storageError) {
          alert("The artwork record was deleted, but its image file could not be removed: " + storageError.message);
        }
      }

      await loadArtwork();
    });

    content.append(title, description, category, deleteButton);
    card.append(img, content);
    gallery.append(card);
  }
}

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = document.getElementById("art-title").value.trim();
  const description = document.getElementById("art-description").value.trim();
  const category = document.getElementById("art-category").value;
  const file = document.getElementById("art-file").files[0];

  if (!file) {
    uploadMessage.textContent = "Please choose an image.";
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
  ];

  if (!allowedTypes.includes(file.type)) {
    uploadMessage.textContent = "Please select a PNG, JPG, WEBP or GIF image.";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    uploadMessage.textContent = "The image must be smaller than 10 MB.";
    return;
  }

  uploadButton.disabled = true;
  uploadMessage.textContent = "Uploading your artwork...";

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const imagePath = `${currentUser.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: storageError } = await supabaseClient
    .storage.from("artworks")
    .upload(imagePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (storageError) {
    uploadMessage.textContent = "Image upload failed: " + storageError.message;
    uploadButton.disabled = false;
    return;
  }

  const { data: publicData } = supabaseClient
    .storage.from("artworks")
    .getPublicUrl(imagePath);

  const { error: databaseError } = await supabaseClient
    .from("artworks")
    .insert({
      owner_id: currentUser.id,
      title,
      description,
      category,
      image_url: publicData.publicUrl,
      image_path: imagePath
    });

  if (databaseError) {
    await supabaseClient.storage.from("artworks").remove([imagePath]);
    uploadMessage.textContent = "Image uploaded, but saving its details failed: " + databaseError.message;
    uploadButton.disabled = false;
    return;
  }

  uploadForm.reset();
  uploadMessage.textContent = "Artwork uploaded successfully! 💜";
  uploadButton.disabled = false;
  await loadArtwork();
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert("Could not log out: " + error.message);
    logoutButton.disabled = false;
    return;
  }

  window.location.replace("login.html");
});

(async function startDashboard() {
  const loggedIn = await checkLogin();

  if (loggedIn) {
    await loadArtwork();
  }
})();
const { data: userData } = await supabaseClient.auth.getUser();
console.log("Logged-in user ID:", userData.user?.id);

const { data, error } = await supabaseClient
  .from("artworks")
  .select("id, owner_id, title, image_path");

console.log("Artwork records:", data);
console.log("Error:", error);
