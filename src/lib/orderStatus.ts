import { OrderStatus } from "./types";

export const STATUS_FLOW: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

const STEP_SECONDS = 8;

/** Deterministic, server-computed order status based on elapsed time since creation. */
export function computeOrderStatus(createdAt: Date): OrderStatus {
  const elapsedSeconds = (Date.now() - createdAt.getTime()) / 1000;
  const index = Math.min(
    STATUS_FLOW.length - 1,
    Math.floor(elapsedSeconds / STEP_SECONDS)
  );
  return STATUS_FLOW[Math.max(0, index)];
}
