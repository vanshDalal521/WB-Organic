import { NextRequest, NextResponse } from "next/server";

const MOCK_DASHBOARD = {
  customers: { total: 0, active: 0 },
  orders: { total: 0, today: 0 },
  revenue: { total: 0, today: 0 },
  subscriptions: { total: 0, active: 0 },
  deliveries: { today: 0, completed: 0 },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = new URL(request.url);
  const joined = path.join("/");
  const lastSegment = path[path.length - 1];
  const isNumericId = /^\d+$/.test(lastSegment);

  if (isNumericId) {
    return NextResponse.json({ success: true, message: "OK", data: null });
  }

  if (joined === "admin/dashboard") {
    return NextResponse.json({ success: true, message: "OK", data: MOCK_DASHBOARD });
  }

  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  return NextResponse.json({
    success: true,
    message: "OK",
    data: [],
    meta: { total: 0, page, limit, totalPages: 0 },
  });
}

const ok = () => NextResponse.json({ success: true, message: "OK", data: null });

export { ok as POST, ok as PUT, ok as PATCH, ok as DELETE };
