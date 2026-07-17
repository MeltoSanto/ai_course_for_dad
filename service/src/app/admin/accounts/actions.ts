"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { requireAdmin } from "@/lib/session";

export type AccountActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const roles = Object.values(UserRole);
const usernamePattern = /^[\p{L}\p{N}._-]+$/u;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeIdentifier(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("ru-RU");
}

function validateAccountFields({
  displayName,
  username,
}: {
  displayName: string;
  username: string;
}) {
  if (username.length < 2 || username.length > 40 || !usernamePattern.test(username)) {
    return "Логин: от 2 до 40 символов — буквы, цифры, точка, дефис или подчёркивание.";
  }

  if (displayName.length < 1 || displayName.length > 80) {
    return "Имя должно содержать от 1 до 80 символов.";
  }

  return null;
}

function validatePassword(password: string) {
  if (password.length < 4 || password.length > 128) {
    return "Пароль должен содержать от 4 до 128 символов. Сложные требования не применяются.";
  }

  return null;
}

async function hasIdentifierCollision({
  displayName,
  excludeUserId,
  username,
}: {
  displayName: string;
  excludeUserId?: string;
  username: string;
}) {
  const candidates = new Set([
    normalizeIdentifier(username),
    normalizeIdentifier(displayName),
  ]);
  const users = await db.user.findMany({
    where: excludeUserId ? { id: { not: excludeUserId } } : undefined,
    select: {
      username: true,
      displayName: true,
    },
  });

  return users.some((user) =>
    [user.username, user.displayName].some((identifier) =>
      candidates.has(normalizeIdentifier(identifier)),
    ),
  );
}

async function isLastActiveAdmin(userId: string) {
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  if (!target || target.role !== UserRole.ADMIN || !target.isActive) return false;

  return (
    (await db.user.count({
      where: {
        role: UserRole.ADMIN,
        isActive: true,
      },
    })) <= 1
  );
}

function refreshAccounts() {
  revalidatePath("/admin");
  revalidatePath("/admin/accounts");
  revalidatePath("/admin/progress");
}

export async function createAccountAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  void _previousState;
  await requireAdmin();

  const username = text(formData, "username");
  const displayName = text(formData, "displayName");
  const password = String(formData.get("password") ?? "");
  const roleValue = text(formData, "role");
  const role = roles.includes(roleValue as UserRole)
    ? (roleValue as UserRole)
    : UserRole.STUDENT;
  const validationError =
    validateAccountFields({ username, displayName }) ?? validatePassword(password);

  if (validationError) return { status: "error", message: validationError };

  if (await hasIdentifierCollision({ username, displayName })) {
    return {
      status: "error",
      message: "Такой логин или отображаемое имя уже используется другим аккаунтом.",
    };
  }

  await db.user.create({
    data: {
      username,
      displayName,
      passwordHash: hashPassword(password),
      role,
    },
  });
  refreshAccounts();

  return {
    status: "success",
    message: `Аккаунт ${displayName} создан.`,
  };
}

export async function updateAccountAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  void _previousState;
  const admin = await requireAdmin();
  const userId = text(formData, "userId");
  const username = text(formData, "username");
  const displayName = text(formData, "displayName");
  const roleValue = text(formData, "role");
  const role = roles.includes(roleValue as UserRole)
    ? (roleValue as UserRole)
    : UserRole.STUDENT;
  const validationError = validateAccountFields({ username, displayName });

  if (!userId || validationError) {
    return { status: "error", message: validationError ?? "Аккаунт не найден." };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!target) return { status: "error", message: "Аккаунт не найден." };

  if (target.id === admin.id && role !== UserRole.ADMIN) {
    return {
      status: "error",
      message: "Нельзя убрать роль администратора у собственного аккаунта.",
    };
  }

  if (target.role === UserRole.ADMIN && role !== UserRole.ADMIN && (await isLastActiveAdmin(userId))) {
    return {
      status: "error",
      message: "Нельзя изменить роль последнего активного администратора.",
    };
  }

  if (await hasIdentifierCollision({ username, displayName, excludeUserId: userId })) {
    return {
      status: "error",
      message: "Такой логин или отображаемое имя уже используется другим аккаунтом.",
    };
  }

  await db.user.update({
    where: { id: userId },
    data: { username, displayName, role },
  });
  refreshAccounts();

  return { status: "success", message: "Данные аккаунта сохранены." };
}

export async function changeAccountPasswordAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  void _previousState;
  await requireAdmin();
  const userId = text(formData, "userId");
  const password = String(formData.get("password") ?? "");
  const validationError = validatePassword(password);

  if (!userId || validationError) {
    return { status: "error", message: validationError ?? "Аккаунт не найден." };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, displayName: true },
  });

  if (!target) return { status: "error", message: "Аккаунт не найден." };

  const now = new Date();
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashPassword(password),
        sessionVersion: { increment: 1 },
      },
    }),
    db.userAccessSession.updateMany({
      where: { userId, signedOutAt: null },
      data: { signedOutAt: now, lastActiveAt: now },
    }),
  ]);
  refreshAccounts();

  return {
    status: "success",
    message: `Пароль для ${target.displayName} изменён. Все старые входы завершены.`,
  };
}

export async function toggleAccountStatusAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  void _previousState;
  const admin = await requireAdmin();
  const userId = text(formData, "userId");
  const target = userId
    ? await db.user.findUnique({
        where: { id: userId },
        select: { id: true, displayName: true, isActive: true },
      })
    : null;

  if (!target) return { status: "error", message: "Аккаунт не найден." };

  if (target.id === admin.id) {
    return { status: "error", message: "Нельзя заблокировать собственный аккаунт." };
  }

  if (target.isActive && (await isLastActiveAdmin(userId))) {
    return {
      status: "error",
      message: "Нельзя заблокировать последнего активного администратора.",
    };
  }

  const nextActive = !target.isActive;
  const now = new Date();
  if (nextActive) {
    await db.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  } else {
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          sessionVersion: { increment: 1 },
        },
      }),
      db.userAccessSession.updateMany({
        where: { userId, signedOutAt: null },
        data: { signedOutAt: now, lastActiveAt: now },
      }),
    ]);
  }
  refreshAccounts();

  return {
    status: "success",
    message: nextActive
      ? `Аккаунт ${target.displayName} разблокирован.`
      : `Аккаунт ${target.displayName} заблокирован, активные входы завершены.`,
  };
}

export async function deleteAccountAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  void _previousState;
  const admin = await requireAdmin();
  const userId = text(formData, "userId");
  const target = userId
    ? await db.user.findUnique({
        where: { id: userId },
        select: { id: true, displayName: true },
      })
    : null;

  if (!target) return { status: "error", message: "Аккаунт не найден." };

  if (target.id === admin.id) {
    return { status: "error", message: "Нельзя удалить собственный аккаунт." };
  }

  if (await isLastActiveAdmin(userId)) {
    return {
      status: "error",
      message: "Нельзя удалить последнего активного администратора.",
    };
  }

  await db.user.delete({ where: { id: userId } });
  refreshAccounts();

  return {
    status: "success",
    message: `Аккаунт ${target.displayName} и связанные с ним данные удалены.`,
  };
}
