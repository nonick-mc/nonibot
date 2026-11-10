import { useState } from 'react';

/**
 * 値を渡して開くダイアログの状態。
 * 閉じても値を消さないので、閉じるアニメーションの間も中身が変わらない。
 * `key` は開くたびに変わるので、中身(フォームなど)を開くたびに作り直したいときに使う。
 */
export function useDialogState<T>() {
  const [state, setState] = useState<{ open: boolean; value?: T; key: number }>({
    open: false,
    key: 0,
  });

  return {
    value: state.value,
    key: state.key,
    show: (value: T) => setState((s) => ({ open: true, value, key: s.key + 1 })),
    close: () => setState((s) => ({ ...s, open: false })),
    props: {
      open: state.open,
      onOpenChange: (open: boolean) => setState((s) => ({ ...s, open })),
    },
  };
}
