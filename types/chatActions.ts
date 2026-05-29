export type DashboardAction =
  | { action: "FILTER_SECTOR"; payload: string }
  | { action: "SORT_BY"; payload: "performance" | "risk" | "value" | "alphabetical" }
  | { action: "SHOW_CHART"; payload: { ticker: string; period: "1D" | "1W" | "1M" | "3M" | "1Y" } }
  | { action: "HIGHLIGHT_STOCKS"; payload: string[] }
  | { action: "COMPARE_STOCKS"; payload: string[] }
  | { action: "SHOW_TOP_N"; payload: number }
  | { action: "RESET_FILTERS"; payload: null }
  | { action: "SANDBOX_TRADE"; payload: { ticker: string; action: "BUY" | "SELL"; quantity: number } }
  | { action: "RECOMMEND_STOCKS"; payload: string[] }
  | { action: "NONE"; payload: null };

export interface ChatResponse {
  message: string;
  dashboardAction?: DashboardAction;
}
