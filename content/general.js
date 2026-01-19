// Create a pill element and style it to float at the bottom left
const pill = document.createElement("div");
pill.style.position = "fixed";
pill.style.bottom = "8px";
pill.style.left = "4px";
pill.style.padding = "5px 12px";
pill.style.background = "#D90452";
pill.style.color = "#fff";
pill.style.borderRadius = "999px";
pill.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
pill.style.fontFamily = "sans-serif";
pill.style.fontSize = "12px";
pill.style.zIndex = "9999";
pill.style.display = "flex";
pill.style.alignItems = "center";
pill.style.gap = "10px";

// Text
const text = document.createElement("span");
text.innerHTML = "MODS SAES 2 By <strong>Reprobados:/</strong>";

// Separator
const separator = document.createElement("span");
separator.textContent = " | ";
separator.style.margin = "0 4px";

// Instagram link and PNG icon
const instaLink = document.createElement("a");
instaLink.href = "https://instagram.com/reprobadosdev";
instaLink.target = "_blank";
instaLink.rel = "noopener noreferrer";
instaLink.style.display = "flex";
instaLink.style.alignItems = "center";
instaLink.style.color = "#fff";
instaLink.style.textDecoration = "none";
const instaImg = document.createElement("img");
instaImg.src =
  "https://img.icons8.com/?size=100&id=0wr4dYtBFwHA&format=png&color=FFFFFF";
instaImg.alt = "Instagram";
instaImg.width = 20;
instaImg.height = 20;
instaImg.style.display = "block";
instaImg.style.filter = "brightness(0) invert(1)";
instaLink.appendChild(instaImg);

// X (Twitter) link and PNG icon
const xLink = document.createElement("a");
xLink.href = "https://x.com/reprobadosdev";
xLink.target = "_blank";
xLink.rel = "noopener noreferrer";
xLink.style.display = "flex";
xLink.style.alignItems = "center";
xLink.style.color = "#fff";
xLink.style.textDecoration = "none";
const xImg = document.createElement("img");
xImg.src =
  "https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png";
xImg.alt = "X";
xImg.width = 20;
xImg.height = 20;
xImg.style.display = "block";
xImg.style.filter = "brightness(0) invert(1)";
xLink.appendChild(xImg);

// Add to pill
pill.appendChild(text);
pill.appendChild(separator);
pill.appendChild(instaLink);
pill.appendChild(xLink);

document.body.appendChild(pill);