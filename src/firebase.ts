import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  collection,
  doc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import type { MovementEntry } from "./data/budgetData";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
void testConnection();

export interface BudgetConfigDoc {
  uid: string;
  displayName: string;
  monthlyBudget: number;
  onboardingCompleted: boolean;
}

function sanitizeBudgetAmount(value: number): number {
  const rounded = Math.round(Number(value));
  if (!Number.isFinite(rounded) || rounded < 0) return 0;
  return Math.min(100000000, rounded);
}

function sanitizeDisplayName(name: string): string {
  const cleaned = name.trim().slice(0, 80);
  return cleaned.length > 0 ? cleaned : "Usuario";
}

export async function saveInitialBudgetConfig(
  uid: string,
  displayName: string,
  monthlyBudget: number
): Promise<void> {
  const path = `users/${uid}/budget/config`;
  try {
    await setDoc(doc(db, "users", uid, "budget", "config"), {
      uid,
      displayName: sanitizeDisplayName(displayName),
      monthlyBudget: sanitizeBudgetAmount(monthlyBudget),
      onboardingCompleted: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateMonthlyBudgetDoc(
  uid: string,
  monthlyBudget: number
): Promise<void> {
  const path = `users/${uid}/budget/config`;
  try {
    await updateDoc(doc(db, "users", uid, "budget", "config"), {
      monthlyBudget: sanitizeBudgetAmount(monthlyBudget),
      onboardingCompleted: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserDisplayNameDoc(
  uid: string,
  displayName: string
): Promise<void> {
  const path = `users/${uid}/budget/config`;
  try {
    await updateDoc(doc(db, "users", uid, "budget", "config"), {
      displayName: sanitizeDisplayName(displayName),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addMovementDoc(
  uid: string,
  movement: Omit<MovementEntry, "id">
): Promise<string> {
  const prefix = movement.type === "income" ? "ing" : "mov";
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const movementId = `${prefix}-${Date.now()}-${randomSuffix}`;
  const path = `users/${uid}/movements/${movementId}`;

  const safeDateISO = /^\d{4}-\d{2}-\d{2}$/.test(movement.dateISO)
    ? movement.dateISO
    : "2026-11-17";
  const safeDay = Math.min(31, Math.max(1, Math.round(movement.day || 1)));
  const safeAmount = Math.min(
    100000000,
    Math.max(1, Math.round(movement.amount))
  );

  const payload: Record<string, unknown> = {
    uid,
    type: movement.type === "income" ? "income" : "expense",
    day: safeDay,
    dateISO: safeDateISO,
    dateLabel: (movement.dateLabel || safeDateISO).trim().slice(0, 40),
    description: (movement.description || "Movimiento").trim().slice(0, 160),
    category: (movement.category || "Alimentación").trim().slice(0, 60),
    amount: safeAmount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (movement.paymentMethod && movement.paymentMethod.trim().length > 0) {
    payload.paymentMethod = movement.paymentMethod.trim().slice(0, 40);
  }
  if (typeof movement.notes === "string" && movement.notes.trim().length > 0) {
    payload.notes = movement.notes.trim().slice(0, 500);
  }

  try {
    await setDoc(doc(collection(db, "users", uid, "movements"), movementId), payload);
    return movementId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
