// AutoMod Plusが削除したメッセージのID
const deletedIds = new Set<string>();

export function markAutoModDeleted(messageId: string) {
  deletedIds.add(messageId);
  setTimeout(() => deletedIds.delete(messageId), 30_000).unref();
}

export function unmarkAutoModDeleted(messageId: string) {
  deletedIds.delete(messageId);
}

export function consumeAutoModDeleted(messageId: string) {
  return deletedIds.delete(messageId);
}
