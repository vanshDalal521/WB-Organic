import { NextRequest, NextResponse } from "next/server";

const ADMIN = {
  id: "admin-001",
  email: "admin@wborganicdairy.com",
  name: "Super Admin",
  role: "SUPER_ADMIN",
  phone: "9999999999",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body;

  if (email === ADMIN.email && password === "admin123") {
    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        accessToken: "mock-admin-token-" + Date.now(),
        refreshToken: "mock-refresh-token-" + Date.now(),
        user: ADMIN,
      },
    });
  }

  return NextResponse.json(
    { success: false, message: "Invalid email or password", data: null },
    { status: 401 }
  );
}
