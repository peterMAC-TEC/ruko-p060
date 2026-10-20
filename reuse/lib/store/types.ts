import type { TabBundle } from "../types";

/**
 * Storage backend. A tab is one document; writes are optimistic:
 * put() succeeds only if the stored version still equals expectedVersion
 * (null = the tab must not exist yet).
 */
export interface TabRepository {
  get(tabId: string): Promise<TabBundle | null>;
  put(bundle: TabBundle, expectedVersion: number | null): Promise<boolean>;
  /** Every tab, for the prototype's stats page. */
  list(): Promise<TabBundle[]>;
}
