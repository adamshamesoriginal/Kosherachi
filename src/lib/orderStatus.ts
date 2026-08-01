import { OrderStatus } from "./types";

export const STATUS_FLOW: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export function isForwardTransition(current: OrderStatus, next: OrderStatus): boolean {
  const currentIndex = STATUS_FLOW.indexOf(current);
  const nextIndex = STATUS_FLOW.indexOf(next);
  return nextIndex > currentIndex;
}

export function nextStatus(current: OrderStatus): OrderStatus | null {
  const currentIndex = STATUS_FLOW.indexOf(current);
  return currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null;
}
