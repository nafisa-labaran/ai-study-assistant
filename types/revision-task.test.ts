
import { describe, expect, it } from "vitest";
import { revisionTaskSchema } from "./revision-task";

describe("revisionTaskSchema", () => {
  const validTask = {
    title: "Revise Software Engineering",
    description: "Review requirements engineering and testing.",
    dueDate: "2027-01-15",
  };

  it("accepts a valid revision task", () => {
    expect(revisionTaskSchema.safeParse(validTask).success).toBe(true);
  });

  it("rejects a title that is too short", () => {
    expect(
      revisionTaskSchema.safeParse({
        ...validTask,
        title: "AB",
      }).success,
    ).toBe(false);
  });

  it("rejects a description that is too long", () => {
    expect(
      revisionTaskSchema.safeParse({
        ...validTask,
        description: "A".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("rejects an impossible calendar date", () => {
    expect(
      revisionTaskSchema.safeParse({
        ...validTask,
        dueDate: "2027-02-30",
      }).success,
    ).toBe(false);
  });

  it("rejects unexpected fields", () => {
    expect(
      revisionTaskSchema.safeParse({
        ...validTask,
        isAdmin: true,
      }).success,
    ).toBe(false);
  });
});
