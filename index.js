// Force HTTPS
if (location.protocol === "http:") location.protocol = "https:";

// Service worker registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(reg => console.log("Service Worker registered", reg))
    .catch(err => console.error("Service Worker not registered", err));
} else {
  console.warn("Service Worker not supported");
}

// Check for PWA installation
const isInstalledPWA = window.matchMedia("(display-mode: standalone)").matches;

// Install reminder
const installNudge = document.querySelector("#install-nudge");
const closeButton = document.getElementById("close-button");
const hideBanner = localStorage.getItem("hide-install-nudge");
if (!isInstalledPWA && installNudge && !hideBanner) {
  installNudge.style.display = "block";
  closeButton.addEventListener("click", () => {
    localStorage.setItem("hide-install-nudge", true);
    installNudge.style.display = "none";
  });
} else {
  installNudge.style.display = "none";
}

// Push notifications
const enablePushNotifications = false;
const pushServerBaseURL = "";
const VAPID_PUBLIC_KEY = "";
let pushNotificationPermissionGranted = false;
const buttonNotifications = document.getElementById("button-notifications");
if (buttonNotifications && enablePushNotifications) {
  buttonNotifications.addEventListener("click", askNotificationPermission);
  handlePermission();
}
window.addEventListener("touchstart", clearBadge, false);

function handlePermission() {
  if ("Notification" in window && buttonNotifications) {
    if (Notification.permission !== "granted") {
      buttonNotifications.style.display = "block";
      pushNotificationPermissionGranted = true;
    } else {
      buttonNotifications.style.display = "none";
    }
  }
}

function askNotificationPermission() {
  if (!("Notification" in window)) return;
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      handlePermission();
      subscribeToPush();
      new Notification("Notifications enabled", {
        body: "We're best friends now!",
        icon: "https://cdn.glitch.com/560ed5ed-9d00-433a-9ff9-7750d79d13da%2FGlitch_TeamAvatar.png?v=1624643105812"
      });
    }
  });
}

async function subscribeToPush() {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  postToServer(`${pushServerBaseURL}/add-subscription`, subscription);
}

async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  postToServer(`${pushServerBaseURL}/remove-subscription`, {
    endpoint: subscription.endpoint
  });
  await subscription.unsubscribe();
}

async function postToServer(url, data) {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Badging
const badgeCount = document.getElementById("badge-count");
const buttonIncrementBadge = document.getElementById("button-set-badge");
const badgingFeatures = document.getElementById("badging-area");
if (isInstalledPWA && badgingFeatures && pushNotificationPermissionGranted) {
  badgingFeatures.style.display = "block";
}
if (buttonIncrementBadge) {
  buttonIncrementBadge.addEventListener("click", () => {
    setBadge(badgeCount.value);
    console.log(`set badge to ${badgeCount.value}`);
  });
}

function setBadge(total) {
  const badgeAPIs = ["setAppBadge", "setExperimentalAppBadge"];
  badgeAPIs.forEach(api => {
    if (navigator[api]) {
      navigator[api](total);
    }
  });
}

function clearBadge() {
  const badgeAPIs = ["clearAppBadge", "clearExperimentalAppBadge"];
  badgeAPIs.forEach(api => {
    if (navigator[api]) {
      navigator[api]();
    }
  });
}

// Orientation changes
const portraitClasses = document.querySelectorAll(".show-for-portrait");
const landscapeClasses = document.querySelectorAll(".show-for-landscape");
function showOrientationBlocks() {
  const isPortrait =
    screen.orientation.type.includes("portrait") ||
    screen.orientation.type.includes("secondary");
  const display = isPortrait ? "block" : "none";
  portraitClasses.forEach(el => (el.style.display = display));
  landscapeClasses.forEach(el => (el.style.display = display === "block" ? "none" : "block"));
}

function rotateWithNoScale() {
  const viewport = document.querySelector("meta[name=viewport]");
  if (viewport) {
    const content = viewport.getAttribute("content");
    viewport.setAttribute("content", content + ", maximum-scale=1.0");
    setTimeout(() => viewport.setAttribute("content", content), 100);
  }
}

screen.orientation.addEventListener("change", () => {
  if (isIOS) rotateWithNoScale();
  showOrientationBlocks();
});

showOrientationBlocks();
