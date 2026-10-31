self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "Nova Digital", body: event.data ? event.data.text() : "" }; }
  const title = data.title || "Nova Digital";
  const options = {
    body: data.body || "You have a new update.",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: { href: data.href || "/account" },
    tag: data.type || "nova-update",
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.href || "/account", self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        client.navigate(destination);
        return client.focus();
      }
    }
    return clients.openWindow(destination);
  }));
});
