import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Token refreshed",
    data: {
      accessToken: "mock-admin-token-" + Date.now(),
      refreshToken: "mock-refresh-token-" + Date.now(),
    },
  });
}
