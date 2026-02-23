import { UrlSegment } from "./types";

let counter = 0;
function uid(): string {
  return `seg-${Date.now()}-${counter++}`;
}

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  protocol: "The protocol used to access the resource",
  host: "The domain name of the server",
  port: "The port number on the server",
  pathname: "The path to the resource on the server",
  hash: "A fragment identifier for a section of the page",
};

export function parseUrl(raw: string): UrlSegment[] {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return [
      {
        id: uid(),
        type: "custom",
        label: "Invalid URL",
        value: raw,
        description: "Could not parse this as a valid URL",
      },
    ];
  }

  const segments: UrlSegment[] = [];

  segments.push({
    id: uid(),
    type: "protocol",
    label: "Protocol",
    value: url.protocol.replace(":", ""),
    description: DEFAULT_DESCRIPTIONS.protocol,
  });

  segments.push({
    id: uid(),
    type: "host",
    label: "Host",
    value: url.hostname,
    description: DEFAULT_DESCRIPTIONS.host,
  });

  if (url.port) {
    segments.push({
      id: uid(),
      type: "port",
      label: "Port",
      value: url.port,
      description: DEFAULT_DESCRIPTIONS.port,
    });
  }

  if (url.pathname && url.pathname !== "/") {
    segments.push({
      id: uid(),
      type: "pathname",
      label: "Path",
      value: url.pathname,
      description: DEFAULT_DESCRIPTIONS.pathname,
    });
  }

  url.searchParams.forEach((value, key) => {
    segments.push({
      id: uid(),
      type: "search-param",
      label: `Param: ${key}`,
      value: `${key}=${value}`,
      description: `Query parameter "${key}" with value "${value}"`,
    });
  });

  if (url.hash) {
    segments.push({
      id: uid(),
      type: "hash",
      label: "Fragment",
      value: url.hash.replace("#", ""),
      description: DEFAULT_DESCRIPTIONS.hash,
    });
  }

  return segments;
}
