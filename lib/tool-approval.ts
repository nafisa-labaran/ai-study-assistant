
import {
  createHmac,
  createHash,
  timingSafeEqual,
} from "node:crypto";
export type ApprovalPayload = {
  toolName: "saveStudyGuide" | "createStudyTask";
  input: unknown;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.APPROVAL_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("APPROVAL_SECRET must be configured with at least 32 characters.");
  }

  return secret;
}

export function createApprovalToken(
  payload: ApprovalPayload,
): string {
  const encodedPayload = Buffer.from(
    JSON.stringify(payload),
  ).toString("base64url");

  const signature = createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyApprovalToken(token: string): ApprovalPayload {
  const parts = token.split(".");

  if (parts.length !== 2) {
    throw new Error("Invalid approval token.");
  }

  const [encodedPayload, suppliedSignature] = parts;

  const expectedSignature = createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest();

  const actualSignature = Buffer.from(
    suppliedSignature,
    "base64url",
  );

  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    throw new Error("Approval token verification failed.");
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as ApprovalPayload;

  if (
    !payload ||
    !["saveStudyGuide", "createStudyTask"].includes(payload.toolName) ||
    typeof payload.expiresAt !== "number" ||
    payload.expiresAt <= Date.now() ||
    !("input" in payload)
  ) {
    throw new Error("Approval token is invalid or has expired.");
  }

  return payload;
}
export function hashApprovalToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}