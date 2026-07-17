import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

const SESSION_COOKIE = "ai_course_session";
const SESSION_DAYS = 14;

type SessionPayload = {
  userId: string;
  role: UserRole;
  expiresAt: string;
  accessSessionId?: string;
  sessionVersion?: number;
};

export type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production");
  }

  return secret ?? "dev-only-auth-secret";
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(value: string | undefined): SessionPayload | null {
  if (!value) {
    return null;
  }

  const [body, signature] = value.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (new Date(payload.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function createSession(
  user: { id: string; role: UserRole; sessionVersion: number },
  accessSessionId?: string,
) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    encodeSession({
      userId: user.id,
      role: user.role,
      expiresAt: expiresAt.toISOString(),
      accessSessionId,
      sessionVersion: user.sessionVersion,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    },
  );
}

export async function deleteSession() {
  const session = await getSession();

  if (session?.accessSessionId) {
    const now = new Date();
    await db.userAccessSession.updateMany({
      where: {
        id: session.accessSessionId,
        userId: session.userId,
      },
      data: {
        lastActiveAt: now,
        signedOutAt: now,
      },
    });
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      sessionVersion: true,
    },
  });

  if (!user?.isActive || (session.sessionVersion ?? 1) !== user.sessionVersion) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return user;
}
