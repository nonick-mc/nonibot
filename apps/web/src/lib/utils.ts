import type { Ref, RefCallback, RefObject } from 'react';
export { cn } from "cn";

export function mergeRefs<T>(...refs: (Ref<T> | undefined | null)[]): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(node);
      else (ref as RefObject<T | null>).current = node;
    }
  };
}
