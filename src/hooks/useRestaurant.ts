"use client";

import { useEffect, useState } from "react";
import { Restaurant } from "@/lib/types";

export function useRestaurant(id: string | null) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local state to the id prop clearing
      setRestaurant(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    fetch(`/api/restaurants/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load restaurant");
        return res.json();
      })
      .then((data: Restaurant | null) => {
        if (data) setRestaurant(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return { restaurant, loading, notFound };
}
