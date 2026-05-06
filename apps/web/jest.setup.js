// Jest DOM matchers 추가
import "@testing-library/jest-dom";

// 전역 모킹 설정
global.fetch = jest.fn();

// Next.js router 모킹
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useParams() {
    return {};
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// React Hot Toast 모킹
/*
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
  Toaster: () => null,
}));
*/

// AI SDK 모킹
/*
jest.mock('ai/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));
*/

// Lucide React 아이콘 모킹
jest.mock("lucide-react", () => {
  const React = require("react");
  const icons = [
    "Heart",
    "MessageSquare",
    "User",
    "Mail",
    "Lock",
    "Eye",
    "EyeOff",
    "Calendar",
    "Shield",
    "Users",
    "ArrowRight",
    "ArrowLeft",
    "Edit3",
    "Save",
    "LogOut",
    "Trash2",
    "Sparkles",
    "Send",
    "Menu",
    "X",
    "PlusCircle",
    "Play",
    "Plus",
    "Pencil",
    "RotateCcw",
  ];

  const iconComponents = {};
  icons.forEach((icon) => {
    iconComponents[icon] = ({ className, ...props }) =>
      React.createElement("svg", {
        "data-testid": `${icon.toLowerCase()}-icon`,
        className,
        ...props,
      });
  });

  // Fallback: return a generic svg for any unlisted icon so we don't break
  // shadcn components that import arbitrary icons (ChevronDown, Check, X, etc.).
  return new Proxy(iconComponents, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === "string" && /^[A-Z]/.test(prop)) {
        const Component = ({ className, ...props }) =>
          React.createElement("svg", {
            "data-testid": `${prop.toLowerCase()}-icon`,
            className,
            ...props,
          });
        target[prop] = Component;
        return Component;
      }
      return undefined;
    },
  });
});

jest.mock("@gynecology-chatbot/db/prisma", () => {
  function getDbClient() {
    try {
      return require("@/lib/db/admin-client");
    } catch {
      return {};
    }
  }

  function selectedColumns(select) {
    if (!select || typeof select !== "object") return "*";
    return Object.entries(select)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([column]) => column)
      .join(",");
  }

  function formatValue(value) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
  }

  function whereParams(where = {}) {
    const params = [];
    for (const [column, value] of Object.entries(where ?? {})) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        if ("in" in value) {
          params.push(`${column}=in.(${value.in.join(",")})`);
        } else if ("not" in value && value.not === null) {
          params.push(`${column}=not.is.null`);
        } else {
          for (const operator of ["eq", "gte", "lte", "lt", "gt"]) {
            if (operator in value) {
              params.push(
                `${column}=${operator}.${formatValue(value[operator])}`,
              );
            }
          }
        }
      } else if (value === null) {
        params.push(`${column}=is.null`);
      } else if (value !== undefined) {
        params.push(`${column}=eq.${formatValue(value)}`);
      }
    }
    return params;
  }

  function orderParams(orderBy) {
    if (!orderBy) return [];
    const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
    return entries.flatMap((entry) =>
      Object.entries(entry).map(([column, direction]) => {
        if (typeof direction === "string") {
          return `order=${column}.${direction}`;
        }
        return `order=${column}.asc`;
      }),
    );
  }

  function buildPath(table, args = {}) {
    const params = [
      `select=${selectedColumns(args.select)}`,
      ...whereParams(args.where),
      ...orderParams(args.orderBy),
      args.take || args.limit ? `limit=${args.take ?? args.limit}` : null,
    ].filter(Boolean);
    return `${table}?${params.join("&")}`;
  }

  function firstRow(rows) {
    return Array.isArray(rows) ? (rows[0] ?? null) : rows;
  }

  function normalizeDateFields(row, select) {
    if (!row || typeof row !== "object") return row;
    const next = { ...row };
    const selected =
      select && typeof select === "object" ? Object.keys(select) : [];
    for (const key of [...new Set([...Object.keys(next), ...selected])]) {
      const shouldBeDate =
        key === "date" ||
        key.endsWith("_at") ||
        key === "due_date" ||
        key === "expires_at" ||
        key === "revoked_at" ||
        key === "last_message_at";
      if (!shouldBeDate) continue;
      if (next[key] === undefined && selected.includes(key)) {
        next[key] = new Date("2026-04-17T00:00:00.000Z");
      } else if (typeof next[key] === "string") {
        next[key] = new Date(next[key]);
      }
    }
    return next;
  }

  function createModel(table) {
    return {
      async findMany(args = {}) {
        const { dbSelect } = getDbClient();
        if (!dbSelect) return [];
        const rows = await dbSelect(buildPath(table, args)).catch(() => []);
        return Array.isArray(rows)
          ? rows.map((row) => normalizeDateFields(row, args.select))
          : rows;
      },
      async findFirst(args = {}) {
        const rows = await this.findMany({ ...args, take: args.take ?? 1 });
        return firstRow(rows);
      },
      async findUnique(args = {}) {
        const rows = await this.findMany({ ...args, take: 1 });
        return firstRow(rows);
      },
      async create(args = {}) {
        const { dbInsert } = getDbClient();
        if (!dbInsert) return args.data ?? {};
        const rows = await dbInsert(table, args.data ?? {}).catch(() => []);
        return firstRow(rows) ?? args.data ?? {};
      },
      async update(args = {}) {
        const { dbUpdate } = getDbClient();
        if (!dbUpdate) return args.data ?? {};
        const rows = await dbUpdate(
          `${table}?${whereParams(args.where).join("&")}`,
          args.data ?? {},
        ).catch(() => []);
        return (
          normalizeDateFields(firstRow(rows), args.select) ??
          normalizeDateFields(args.data ?? {}, args.select)
        );
      },
      async updateMany(args = {}) {
        return this.update(args);
      },
      async delete(args = {}) {
        const { dbDelete } = getDbClient();
        if (!dbDelete) return {};
        return dbDelete(`${table}?${whereParams(args.where).join("&")}`).catch(
          () => [],
        );
      },
    };
  }

  return {
    prisma: new Proxy(
      {
        $queryRaw: jest.fn(async () => []),
        $transaction: jest.fn(async (items) => Promise.all(items)),
      },
      {
        get(target, prop) {
          if (prop in target) return target[prop];
          const model = createModel(String(prop));
          target[prop] = model;
          return model;
        },
      },
    ),
  };
});

// IntersectionObserver 모킹 (스크롤 관련 테스트용)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ResizeObserver 모킹
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// matchMedia 모킹 (반응형 디자인 테스트용)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 환경변수 모킹
process.env = {
  ...process.env,
  NEXT_PUBLIC_APP_URL: "http://localhost:4000",
  NODE_ENV: "test",
};

if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (typeof global.Request === "undefined") {
  const { ReadableStream, TransformStream } = require("stream/web");
  global.ReadableStream = ReadableStream;
  global.TransformStream = TransformStream;
  const { Headers, Request, Response } = require("undici");
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
}

global.fetch = jest.fn(
  async () =>
    new global.Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
);
