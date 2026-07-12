import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "User retrieved",
    data: {
      user: {
        id: "admin-001",
        email: "admin@wborganicdairy.com",
        name: "Super Admin",
        role: "SUPER_ADMIN",
        phone: "9999999999",
      },
    },
  });
}
