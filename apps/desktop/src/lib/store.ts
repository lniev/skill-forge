import { Store } from "@tauri-apps/plugin-store"

let store: Store | null = null

export async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load("store.bin")
  }
  return store
}
