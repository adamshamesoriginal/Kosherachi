"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MenuItem, SelectedOption } from "@/lib/types";

interface Props {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (selectedOptions: SelectedOption[], note: string, quantity: number) => void;
}

export function MenuItemCustomizeSheet({ item, onClose, onConfirm }: Props) {
  const options = useMemo(() => item.options ?? [], [item.options]);
  // choiceIdsByOption[optionId] = selected choice ids (one for "single", many for "multi")
  const [choiceIdsByOption, setChoiceIdsByOption] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showValidation, setShowValidation] = useState(false);

  const toggleChoice = (optionId: string, choiceId: string, type: "single" | "multi") => {
    setChoiceIdsByOption((prev) => {
      const current = prev[optionId] ?? [];
      if (type === "single") {
        return { ...prev, [optionId]: current[0] === choiceId ? [] : [choiceId] };
      }
      const next = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId];
      return { ...prev, [optionId]: next };
    });
  };

  const missingRequired = useMemo(
    () => options.filter((o) => o.required && (choiceIdsByOption[o.id] ?? []).length === 0),
    [options, choiceIdsByOption]
  );

  const selectedOptions: SelectedOption[] = useMemo(() => {
    const result: SelectedOption[] = [];
    for (const option of options) {
      const chosenIds = choiceIdsByOption[option.id] ?? [];
      for (const choice of option.choices) {
        if (chosenIds.includes(choice.id)) {
          result.push({
            optionId: option.id,
            optionName: option.name,
            choiceId: choice.id,
            choiceLabel: choice.label,
            priceDelta: choice.priceDelta,
          });
        }
      }
    }
    return result;
  }, [options, choiceIdsByOption]);

  const unitPrice = item.price + selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);

  const handleConfirm = () => {
    if (missingRequired.length > 0) {
      setShowValidation(true);
      return;
    }
    onConfirm(selectedOptions, note.trim(), quantity);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3 p-4 border-b border-stone-100">
          <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-stone-100">
            <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-stone-900 truncate">{item.name}</h3>
            <p className="text-xs text-stone-500 line-clamp-2">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="text-stone-400 text-xl self-start shrink-0"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-5">
          {options.map((option) => {
            const isMissing = showValidation && option.required && (choiceIdsByOption[option.id] ?? []).length === 0;
            return (
              <div key={option.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-stone-900 text-sm">{option.name}</h4>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      option.required ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {option.required ? "חובה" : "לבחירה"}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {option.choices.map((choice) => {
                    const checked = (choiceIdsByOption[option.id] ?? []).includes(choice.id);
                    return (
                      <label
                        key={choice.id}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 cursor-pointer ${
                          checked ? "border-emerald-600 bg-emerald-50" : "border-stone-200"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm text-stone-700">
                          <input
                            type={option.type === "single" ? "radio" : "checkbox"}
                            name={option.id}
                            checked={checked}
                            onChange={() => toggleChoice(option.id, choice.id, option.type)}
                            className="h-4 w-4"
                          />
                          {choice.label}
                        </span>
                        {choice.priceDelta > 0 && (
                          <span className="text-xs text-stone-500 shrink-0">
                            +₪{choice.priceDelta.toFixed(2).replace(/\.00$/, "")}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {isMissing && (
                  <p className="text-xs text-red-600">יש לבחור אפשרות עבור &quot;{option.name}&quot;</p>
                )}
              </div>
            );
          })}

          <div className="flex flex-col gap-1.5">
            <h4 className="font-semibold text-stone-900 text-sm">הערות מיוחדות</h4>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="לדוגמה: בלי בצל, הרוטב בצד"
              rows={2}
              maxLength={200}
              className="rounded-xl border border-stone-200 px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-stone-900 text-sm">כמות</h4>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-8 w-8 rounded-full bg-stone-100 font-bold text-stone-600"
              >
                −
              </button>
              <span className="font-semibold w-4 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="h-8 w-8 rounded-full bg-stone-100 font-bold text-stone-600"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-stone-100">
          <button
            onClick={handleConfirm}
            className="w-full rounded-2xl bg-emerald-700 text-white font-bold py-3.5 flex items-center justify-between px-5"
          >
            <span>הוספה לעגלה</span>
            <span>₪{(unitPrice * quantity).toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
