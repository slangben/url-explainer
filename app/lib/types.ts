export interface UrlSegment {
  id: string;
  type: "protocol" | "host" | "port" | "pathname" | "search-param" | "hash" | "custom";
  label: string;
  value: string;
  description: string;
}

export interface UrlBreakdown {
  originalUrl: string;
  segments: UrlSegment[];
}
