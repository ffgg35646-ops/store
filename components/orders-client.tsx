"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronRight, Clock3, Package, PackageCheck, Search, ShoppingBag } from "lucide-react";
import { money } from "@/components/product-card";
import { PageIntro } from "@/components/store-shell";
import { useLanguage } from "@/components/language-provider";
import { localizeCustomerError } from "@/components/customer-localization";

type OrderFilter = "all" | "active" | "completed" | "cancelled";

const statusKeys: Record<string, string> = {
  awaiting_payment: "orderStatusAwaiting",
  processing: "orderStatusProcessing",
  delivered: "orderStatusDelivered",
  shipped: "orderStatusShipped",
  completed: "orderStatusCompleted",
  cancelled: "orderStatusCancelled",
  refunded: "orderStatusRefunded"
};

function belongsToFilter(status: string, filter: OrderFilter) {
  if (filter === "all") return true;
  if (filter === "active") return ["awaiting_payment", "processing", "shipped"].includes(status);
  if (filter === "completed") return ["delivered", "completed"].includes(status);
  return ["cancelled", "refunded"].includes(status);
}

export function OrdersClient() {
  const { t, language } = useLanguage();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/orders?lang=${language}`, { cache: "no-store" })
      .then(response => response.json())
      .then(data => {
        if (!active) return;
        if (!Array.isArray(data.orders)) throw new Error(localizeCustomerError(data.error || "Could not load orders.",language,t));
        setOrders(data.orders);
      })
      .catch(error => {
        if (active) setLoadError(localizeCustomerError(error.message || "Could not load orders.",language,t));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [language]);

  const activeCount = orders.filter(order => belongsToFilter(order.status, "active")).length;
  const completedCount = orders.filter(order => belongsToFilter(order.status, "completed")).length;
  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter(order => {
      if (!belongsToFilter(order.status, filter)) return false;
      if (!term) return true;
      const itemNames = (order.items || []).map((item: any) => item.title || "").join(" ");
      return String(order.orderNumber || "").toLowerCase().includes(term) || itemNames.toLowerCase().includes(term);
    });
  }, [orders, filter, search]);

  const filters: { key: OrderFilter; label: string }[] = [
    { key: "all", label: t("ordersFilterAll") },
    { key: "active", label: t("ordersFilterActive") },
    { key: "completed", label: t("ordersFilterCompleted") },
    { key: "cancelled", label: t("ordersFilterCancelled") }
  ];

  return (
    <main className="main-content orders-page">
      <PageIntro eyebrow={t("ordersEyebrow")} title={t("ordersTitle")} description={t("ordersDescription")} />

      <section className="orders-summary-grid">
        <div className="orders-summary-card"><span className="orders-summary-icon"><ShoppingBag size={19} /></span><div><small>{t("ordersTotal")}</small><strong>{orders.length}</strong></div></div>
        <div className="orders-summary-card"><span className="orders-summary-icon active"><Clock3 size={19} /></span><div><small>{t("ordersInProgress")}</small><strong>{activeCount}</strong></div></div>
        <div className="orders-summary-card"><span className="orders-summary-icon complete"><CheckCircle2 size={19} /></span><div><small>{t("ordersCompleted")}</small><strong>{completedCount}</strong></div></div>
      </section>

      <section className="orders-workspace">
        <div className="orders-toolbar">
          <div className="orders-filter-list" role="group" aria-label={t("filterOrders")}>
            {filters.map(item => <button type="button" key={item.key} onClick={() => setFilter(item.key)} className={filter === item.key ? "active" : ""}>{item.label}</button>)}
          </div>
          <label className="orders-search"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t("ordersSearchPlaceholder")} /></label>
        </div>

        {loading ? <div className="orders-loading-list"><div /><div /><div /></div> : loadError ? (
          <div className="empty-state"><Package /><b>{loadError}</b></div>
        ) : filteredOrders.length ? (
          <div className="orders-list">
            {filteredOrders.map(order => {
              const itemCount = (order.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
              const itemPreview = (order.items || []).slice(0, 2);
              const statusLabel = statusKeys[order.status] ? t(statusKeys[order.status]) : String(order.status || "");
              return (
                <article className="order-history-card" key={order._id}>
                  <div className="order-history-top">
                    <div className="order-history-number">
                      <span className="order-history-icon"><PackageCheck size={20} /></span>
                      <div><small>{t("orderNumberLabel")}</small><b>{order.orderNumber}</b><span><CalendarDays size={12} />{new Date(order.createdAt).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}</span></div>
                    </div>
                    <span className={`status-pill status-${order.status}`}>{statusLabel}</span>
                  </div>
                  <div className="order-history-items">
                    {itemPreview.map((item: any, index: number) => <span key={`${order._id}-${index}`}>{item.title}</span>)}
                    {(order.items || []).length > 2 && <small>+{order.items.length - 2}</small>}
                    {!itemPreview.length && <span>{t("orderItems")}</span>}
                  </div>
                  <div className="order-history-bottom">
                    <div className="order-history-total"><small>{t("total")}</small><strong>{money(Number(order.total || 0), order.currency || "USD")}</strong><span>{t("orderItemCount").replace("{count}", String(itemCount))}</span></div>
                    <Link href={`/orders/${order._id}`} className="button button-outline order-view-button">{t("viewOrder")}<ChevronRight size={15} /></Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state orders-empty-state">
            <Package />
            <b>{search || filter !== "all" ? t("noMatchingOrders") : t("noOrders")}</b>
            <span>{search || filter !== "all" ? t("adjustOrderSearch") : t("ordersEmptyDescription")}</span>
            {!search && filter === "all" && <Link href="/#catalog" className="button button-primary">{t("exploreCatalog")}</Link>}
          </div>
        )}
      </section>
    </main>
  );
}
