import type { Id } from "./data.types";

export type Provider = "arkhamdb";

export type ConnectionStatus = "connected" | "disconnected";

type ConnectionUser = {
  id?: number | string;
  username?: string;
};

export type SyncSuccessState = {
  status: "success";
  lastModified?: string;
  errors: string[];
  itemsSynced: number;
  itemsTotal: number;
};

export type SyncErrorState = {
  status: "error";
  errors: string[];
};

export type Connection = {
  createdAt: number;
  provider: Provider;
  status: ConnectionStatus;
  syncDetails?: SyncSuccessState | SyncErrorState;
  user: ConnectionUser;
};

export type ConnectionsState = {
  data: Record<string, Connection>;
  lastSyncedAt?: number;
};

export type ConnectionsSlice = {
  connections: ConnectionsState;

  createConnection(provider: Provider, user: ConnectionUser): void;
  removeConnection(provider: Provider): void;

  sync(): Promise<void>;
  syncProvider(provider: Provider): Promise<void>;

  uploadDeck(id: Id, provider: Provider): Promise<Id>;
};