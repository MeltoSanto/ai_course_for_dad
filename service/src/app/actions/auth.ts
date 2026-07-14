"use server";

import { redirect } from "next/navigation";
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
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Введите логин и пароль." };
  }

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      passwordHash: true,
      role: true,
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Неверный логин или пароль." };
  }

  await createSession(user);
  redirect("/");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
