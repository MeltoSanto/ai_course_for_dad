"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getRequestDeviceInfo, moscowDayKey } from "@/lib/activity";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const loginName = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!loginName || !password) {
    return { error: "Введите имя и пароль." };
  }

  const users = await db.user.findMany({
    select: {
      displayName: true,
      id: true,
      passwordHash: true,
      role: true,
      isActive: true,
      sessionVersion: true,
      username: true,
    },
  });
  const normalizedLoginName = loginName.normalize("NFKC").toLocaleLowerCase("ru-RU");
  const user = users.find(
    (candidate) =>
      candidate.username.normalize("NFKC").toLocaleLowerCase("ru-RU") === normalizedLoginName ||
      candidate.displayName.normalize("NFKC").toLocaleLowerCase("ru-RU") === normalizedLoginName,
  );

  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return { error: "Неверное имя или пароль." };
  }

  const now = new Date();
  const device = getRequestDeviceInfo(await headers());
  const accessSession = await db.userAccessSession.create({
    data: {
      userId: user.id,
      signedInAt: now,
      lastActiveAt: now,
      ...device,
    },
  });

  await db.userActivityDay.upsert({
    where: {
      userId_dayKey: {
        userId: user.id,
        dayKey: moscowDayKey(now),
      },
    },
    update: {
      lastActiveAt: now,
    },
    create: {
      userId: user.id,
      dayKey: moscowDayKey(now),
      firstActiveAt: now,
      lastActiveAt: now,
    },
  });

  await createSession(user, accessSession.id);
  redirect("/");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
