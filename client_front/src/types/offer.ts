export interface Offer {
  id: number;
  name: string;
  description: string;
  price: number;
  requires_all: number[];
  requires_optional: number[];
  excludes: number[];
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface OfferItem {
  offer: Offer;
  score: number;
  matched_optional_count: number;
  total_optional_count: number;
  matched_optional_ids: number[];
  missing_optional_ids: number[];
  optional_coverage: number;
  missing_requires_all_ids: number[];
  hit_excluded_ids: number[];
  reasoning: string[];
}

export interface OfferSelectionResponse {
  requested_attributes: number[];
  total_considered: number;
  total_eligible: number;
  items: OfferItem[];
}