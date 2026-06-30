import { useEffect, useState } from "react";
import { Input, Select } from "../../shared/components/Input";
import type { ListSessionFilters } from "../../shared/api/sessions";

export interface SessionsFiltersState {
  q: string;
  category: string;
  difficulty: string;
  location_type: string;
  tag: string;
  price_min: string;
  price_max: string;
}

const EMPTY: SessionsFiltersState = {
  q: "",
  category: "",
  difficulty: "",
  location_type: "",
  tag: "",
  price_min: "",
  price_max: "",
};

interface Props {
  value: SessionsFiltersState;
  onApply: (filters: SessionsFiltersState) => void;
}

export function SessionsFilters({ value, onApply }: Props) {
  const [state, setState] = useState<SessionsFiltersState>(value ?? EMPTY);

  useEffect(() => {
    setState(value ?? EMPTY);
  }, [value]);

  const update = <K extends keyof SessionsFiltersState>(
    key: K,
    val: SessionsFiltersState[K]
  ) => setState((s) => ({ ...s, [key]: val }));

  return (
    <form
      className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(state);
      }}
    >
      <Input
        name="q"
        label="Search"
        placeholder="Title…"
        value={state.q}
        onChange={(e) => update("q", e.target.value)}
      />
      <Input
        name="category"
        label="Category"
        placeholder="e.g. backend"
        value={state.category}
        onChange={(e) => update("category", e.target.value)}
      />
      <Select
        name="difficulty"
        label="Difficulty"
        value={state.difficulty}
        onChange={(e) => update("difficulty", e.target.value)}
      >
        <option value="">Any</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </Select>
      <Select
        name="location_type"
        label="Format"
        value={state.location_type}
        onChange={(e) => update("location_type", e.target.value)}
      >
        <option value="">Any</option>
        <option value="online">Online</option>
        <option value="in_person">In person</option>
        <option value="hybrid">Hybrid</option>
      </Select>
      <Input
        name="price_min"
        label="Min price"
        type="number"
        min={0}
        value={state.price_min}
        onChange={(e) => update("price_min", e.target.value)}
      />
      <Input
        name="price_max"
        label="Max price"
        type="number"
        min={0}
        value={state.price_max}
        onChange={(e) => update("price_max", e.target.value)}
      />
      <div className="col-span-full flex justify-end gap-2">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setState(EMPTY);
            onApply(EMPTY);
          }}
        >
          Reset
        </button>
        <button type="submit" className="btn-primary">
          Apply filters
        </button>
      </div>
    </form>
  );
}

export function toApiFilters(
  state: SessionsFiltersState,
  page = 1
): ListSessionFilters {
  const out: ListSessionFilters = { page };
  if (state.q) out.q = state.q;
  if (state.category) out.category = state.category;
  if (state.difficulty) out.difficulty = state.difficulty;
  if (state.location_type) out.location_type = state.location_type;
  if (state.tag) out.tag = state.tag;
  if (state.price_min) out.price_min = Number(state.price_min);
  if (state.price_max) out.price_max = Number(state.price_max);
  return out;
}
