import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Plus,
  Repeat,
  Share2,
  Shield,
} from "lucide-react";

import { useDragScroll } from "@/hooks/use-drag-scroll";


import { WidgetErrorBoundary } from "@/components/WidgetErrorBoundary";
import { BottomNav } from "@/components/BottomNav";
import { SyncIndicator } from "@/components/SyncIndicator";
import { NotificationsDrawer } from "@/components/NotificationsDrawer";
import { AllTransactionsSheet } from "@/components/AllTransactionsSheet";
import { ReserveSheet } from "@/components/ReserveSheet";
import { BalanceBreakdownSheet } from "@/components/BalanceBreakdownSheet";
import { ShopeePaySheet } from "@/components/ShopeePaySheet";
import { DueSoonAlert } from "@/components/DueSoonAlert";
import { iconFor } from "@/lib/icon-map";
import {
  daysUntil,
  dueLabel,
  relativeDate,
  toggleBillPaid,
  totals,
  useFinance,
  useMoney,
  useSafeToSpend,
} from "@/lib/finance-store";
import {
  customAccounts,
  customLabel,
  dailyTotals,
  driverBalance,
  shopeePayBalance,
  type StreamKey,
} from "@/lib/streams";
import { WAExportPreviewSheet } from "@/components/WAExportPreviewSheet";
import { ShopeeInclusionBadge } from "@/components/ShopeeInclusionBadge";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "C2H KEUANGAN — Personal Finance Tracker" },
      {
        name: "description",
        content:
          "Track balance, income, expenses and recent transactions in a fast, elegant mobile finance dashboard.",
      },
      { property: "og:title", content: "C2H KEUANGAN — Personal Finance Tracker" },
      {
        property: "og:description",
        content:
          "Track balance, income, expenses and recent transactions in a fast, elegant mobile finance dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const state = useFinance();
  const money = useMoney();
  const { t } = useT();
  const { safeToSpend } = useSafeToSpend();
  const [reserveOpen, setReserveOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [stream, setStream] = useState<StreamKey | null>(null);
  const [shopeeOpen, setShopeeOpen] = useState(false);
  const strip = useDragScroll<HTMLDivElement>();


  const { balance } = useMemo(() => totals(state), [state]);
  // Home boxes show today's activity only, excluding the specialised streams.
  const { income, expense } = useMemo(() => dailyTotals(state), [state]);
  const driverTotal = useMemo(() => driverBalance(state), [state]);
  const customName = useMemo(() => customLabel(state), [state]);
  const shopeeTotal = useMemo(() => shopeePayBalance(state), [state]);
  const unread = state.notifications.filter((n) => !n.read).length;
  const availableBills = state.accounts.find((a) => a.type === "Cash")?.amount ?? 0;
  // Priority order = the order set in Settings > Manage Bills & Installments.
  const bills = state.bills;
  const recent = state.transactions.slice(0, 6);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="app-shell mx-auto flex w-full max-w-md flex-col overflow-x-hidden px-4 pt-2 pb-2">
      <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-1">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
            {t("home.welcome")}
          </p>
          <h1 className="truncate text-lg leading-tight font-semibold tracking-tight">
            {t("home.hello")}, {state.profile.name}
          </h1>
        </div>
        <SyncIndicator />
        <button
          aria-label={t("home.exportWa")}
          title={t("home.exportWa")}
          onClick={() => setExportOpen(true)}
          className="glass tap relative grid size-9 shrink-0 place-items-center rounded-full"
        >
          <Share2 className="size-[17px]" strokeWidth={1.75} />
        </button>
        <button
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          onClick={() => setAlertsOpen(true)}
          className="glass tap relative grid size-9 shrink-0 place-items-center rounded-full"
        >
          <Bell className="size-[17px]" strokeWidth={1.75} />
          {unread > 0 && (
            <span className="bg-expense absolute top-1.5 right-2 size-2 rounded-full" />
          )}
        </button>
      </header>

      {/* Flexible content area: grows to fill, never scrolls itself. */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 pt-2">
        <WidgetErrorBoundary name="home-dashboard">
          {/* Unified dashboard: one hero card owns the total balance, today's
              flow summary and a swipeable wallet strip. */}
          <section className="glass-hero animate-fade-in relative shrink-0 rounded-3xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col items-start gap-1">
                <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
                  {t("home.totalBalance")}
                </p>
                <ShopeeInclusionBadge />
              </div>
              <button
                aria-label={t("home.safeToSpendHint")}
                title={t("home.safeToSpendHint")}
                onClick={() => setReserveOpen(true)}
                className="tap border-foreground/10 bg-foreground/5 text-muted-foreground flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium backdrop-blur-md transition-colors duration-200"
              >
                <Shield className="size-3" strokeWidth={1.8} />
                <span className="tabular-nums">
                  {t("home.safeToSpend")}:{" "}
                  <span className={safeToSpend < 0 ? "text-expense" : "text-income"}>
                    {money(safeToSpend)}
                  </span>
                </span>
                <span className="bg-foreground/10 ml-0.5 inline-flex items-center justify-center rounded-full p-0.5">
                  <Plus className="size-3" strokeWidth={1.8} />
                </span>
              </button>
            </div>

            <div className="mt-1.5">
              <button
                onClick={() => setBreakdownOpen(true)}
                aria-label="View balance breakdown"
                className="tap flex min-w-0 items-baseline gap-2 text-left"
              >
                <span className="truncate text-[2.05rem] leading-none font-semibold tracking-tight tabular-nums">
                  {money(balance)}
                </span>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" strokeWidth={2} />
              </button>
            </div>

            {/* Today's flow: income and expense side by side, net inline. */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="glass rounded-2xl px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="bg-income/15 text-income grid size-6 place-items-center rounded-full">
                    <ArrowDownLeft className="size-3.5" strokeWidth={2} />
                  </span>
                  <span className="text-muted-foreground truncate text-[10px] tracking-wide">
                    {t("home.income")} · {t("home.today")}
                  </span>
                </div>
                <p className="text-income mt-1.5 text-sm font-semibold tabular-nums">
                  + {money(income)}
                </p>
              </div>
              <div className="glass rounded-2xl px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="bg-expense/15 text-expense grid size-6 place-items-center rounded-full">
                    <ArrowUpRight className="size-3.5" strokeWidth={2} />
                  </span>
                  <span className="text-muted-foreground truncate text-[10px] tracking-wide">
                    {t("home.expense")} · {t("home.today")}
                  </span>
                </div>
                <p className="text-expense mt-1.5 text-sm font-semibold tabular-nums">
                  − {money(expense)}
                </p>
              </div>
            </div>

            <p
              className={`mt-2 text-right text-[11px] font-medium tabular-nums ${
                income - expense < 0 ? "text-expense" : "text-income"
              }`}
            >
              {t("home.net")} {income - expense < 0 ? "−" : "+"} {money(Math.abs(income - expense))}
            </p>

            {/* Swipeable wallet strip — drag with a mouse on desktop, swipe on touch. */}
            <div
              ref={strip.ref}
              {...strip.dragProps}
              data-testid="stream-strip"
              className="scroll-slim-x -mx-1 mt-2 flex w-full cursor-grab snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1.5 active:cursor-grabbing"
            >
              <button
                onClick={() => {
                  if (strip.didDrag()) return;
                  setStream("driver");
                }}
                data-testid="stream-card-driver"
                aria-label={`${t("home.driver")}: ${money(driverTotal)}`}
                className="glass tap hover:bg-foreground/10 min-w-[132px] shrink-0 snap-start rounded-2xl px-3 py-2 text-left transition-transform hover:scale-[1.03] active:scale-95"
              >
                <p className="text-muted-foreground truncate text-[9px] tracking-wide uppercase">
                  {t("home.driver")} · {t("home.today")}
                </p>
                <p
                  className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${
                    driverTotal < 0 ? "text-expense" : "text-income"
                  }`}
                >
                  {money(driverTotal)}
                </p>
              </button>
              <button
                onClick={() => {
                  if (strip.didDrag()) return;
                  setStream("custom");
                }}
                data-testid="stream-card-custom"
                aria-label={`${customName}: ${money(customTotal)}`}
                className="glass tap hover:bg-foreground/10 min-w-[132px] shrink-0 snap-start rounded-2xl px-3 py-2 text-left transition-transform hover:scale-[1.03] active:scale-95"
              >
                <p className="text-muted-foreground truncate text-[9px] tracking-wide uppercase">
                  {customName}
                </p>
                <p
                  className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${
                    customTotal < 0 ? "text-expense" : "text-income"
                  }`}
                >
                  {money(customTotal)}
                </p>
              </button>
              {/* Persistent driver wallet — never resets at midnight. */}
              <button
                onClick={() => {
                  if (strip.didDrag()) return;
                  setShopeeOpen(true);
                }}
                data-testid="stream-card-shopee"
                aria-label={`${t("home.shopee")}: ${money(shopeeTotal)}`}
                className="glass tap hover:bg-foreground/10 min-w-[132px] shrink-0 snap-start rounded-2xl px-3 py-2 text-left transition-transform hover:scale-[1.03] active:scale-95"
              >
                <p className="text-muted-foreground truncate text-[9px] tracking-wide uppercase">
                  {t("home.shopee")}
                </p>
                <p
                  className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${
                    shopeeTotal < 0 ? "text-expense" : "text-income"
                  }`}
                >
                  {money(shopeeTotal)}
                </p>
              </button>
              <Link
                to="/wallets"
                aria-label={t("nav.wallets")}
                className="glass tap hover:bg-foreground/10 flex min-w-[112px] shrink-0 snap-start items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-[11px] font-medium transition-transform hover:scale-[1.03] active:scale-95"
              >
                <Wallet className="size-4" strokeWidth={1.8} />
                {t("nav.wallets")}
              </Link>
            </div>

          </section>

        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="home-bills">
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="glass-hero flex min-h-0 flex-1 flex-col rounded-3xl p-4">
              <h2 className="text-muted-foreground shrink-0 text-[10px] font-semibold tracking-widest uppercase">
                {t("home.monthlyBills")}
              </h2>
              {/* Only this list scrolls when there are many bills. */}
              <ul className="scroll-slim mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {bills.map((bill, index) => {
                  const Icon = iconFor(bill.icon);
                  const countdown = dueLabel(bill.dueDate);
                  const remaining = bill.dueDate ? daysUntil(bill.dueDate) : null;
                  const urgent = remaining !== null && !Number.isNaN(remaining) && remaining <= 1;
                  const isCovered = availableBills >= bill.amount;
                  const shortfall = bill.amount - availableBills;
                  return (
                    <li key={bill.id} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="bg-secondary text-foreground grid size-8 shrink-0 place-items-center rounded-full">
                          <Icon className="size-4" strokeWidth={1.8} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-primary/15 text-primary shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold">
                              P{index + 1}
                            </span>
                            <p className="truncate text-xs font-medium">{bill.name}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {countdown && (
                              <span
                                suppressHydrationWarning
                                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                                  urgent
                                    ? "bg-expense/15 text-expense"
                                    : "bg-secondary/70 text-muted-foreground"
                                }`}
                              >
                                {urgent && <AlertTriangle className="size-3" strokeWidth={2} />}
                                {countdown}
                              </span>
                            )}
                            {bill.isRecurring && (
                              <span className="text-muted-foreground inline-flex items-center gap-1 text-[9px]">
                                <Repeat className="size-3" strokeWidth={2} />
                                {t("home.recurring")}
                              </span>
                            )}
                            {!isCovered && !bill.paid && (
                              <span className="text-expense text-[10px]">
                                {t("home.shortBy")} {money(shortfall)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <p
                          className={`text-xs font-semibold tabular-nums ${
                            bill.paid
                              ? "text-muted-foreground line-through"
                              : isCovered
                                ? "text-income"
                                : "text-expense"
                          }`}
                        >
                          {money(bill.amount)}
                        </p>
                        <button
                          onClick={() => toggleBillPaid(bill.id)}
                          aria-label={bill.paid ? t("home.paid") : t("home.markPaid")}
                          title={bill.paid ? t("home.paid") : t("home.markPaid")}
                          className={`tap grid size-7 place-items-center rounded-full transition-colors duration-200 ${
                            bill.paid ? "bg-income/20 text-income" : "glass text-muted-foreground"
                          }`}
                        >
                          <Check className="size-3.5" strokeWidth={2.2} />
                        </button>
                      </div>
                    </li>
                  );
                })}
                {bills.length === 0 && (
                  <li className="text-muted-foreground py-2 text-center text-xs">
                    {t("home.noBills")}
                  </li>
                )}
              </ul>
            </div>
          </section>
        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="home-recent">
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between">
              <h2 className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                {t("home.recent")}
              </h2>
              <button
                onClick={() => setAllOpen(true)}
                className="tap glass text-muted-foreground rounded-full px-2.5 py-1 text-[10px] font-medium"
              >
                {t("home.seeAll")} · {state.transactions.length}
              </button>
            </div>

            {/* Only this list scrolls when there are many transactions. */}
            <ul className="scroll-slim mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {recent.map((tx) => {
                const Icon = iconFor(tx.icon);
                const positive = tx.amount > 0;
                return (
                  <li
                    key={tx.id}
                    className="glass animate-fade-in flex items-center gap-2.5 rounded-2xl px-3 py-2"
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full ${
                        positive ? "bg-income/15 text-income" : "bg-secondary text-foreground"
                      }`}
                    >
                      <Icon className="size-4" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{tx.name}</p>
                      <p
                        className="text-muted-foreground truncate text-[10px]"
                        suppressHydrationWarning
                      >
                        {relativeDate(tx.date)} · {tx.via}
                      </p>
                    </div>

                    <p
                      className={`shrink-0 text-xs font-semibold tabular-nums ${
                        positive ? "text-income" : "text-expense"
                      }`}
                    >
                      {positive ? "+" : "−"} {money(Math.abs(tx.amount))}
                    </p>
                  </li>
                );
              })}
              {recent.length === 0 && (
                <li className="glass text-muted-foreground rounded-xl px-3 py-4 text-center text-xs">
                  {t("home.noTransactions")}
                </li>
              )}
            </ul>
          </section>
        </WidgetErrorBoundary>
      </div>

      <BalanceBreakdownSheet open={breakdownOpen} onClose={() => setBreakdownOpen(false)} />
      <DueSoonAlert />
      <ReserveSheet open={reserveOpen} onClose={() => setReserveOpen(false)} />
      <AllTransactionsSheet open={allOpen} onClose={() => setAllOpen(false)} />
      <AllTransactionsSheet
        open={stream !== null}
        onClose={() => setStream(null)}
        stream={stream}
        {...(stream === "custom" ? { title: customName } : {})}
      />
      <ShopeePaySheet open={shopeeOpen} onClose={() => setShopeeOpen(false)} />
      <WAExportPreviewSheet open={exportOpen} onClose={() => setExportOpen(false)} />
      <NotificationsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />

      <BottomNav active="Home" flow />
    </div>
  );
}
