import { describe, expect, it } from "vitest";

import { GMAIL_ONLY_MESSAGE, TEMP_MAIL_MESSAGE, signInEmail, signupGmail } from "@/features/auth/services/gmail-address";

describe("signupGmail", () => {
  it("keeps one inbox by dropping dots and a plus tag", () => {
    expect(signupGmail("Yash.Kaku+desk@gmail.com")).toEqual({ email: "yashkaku@gmail.com" });
  });

  it("rejects googlemail and temporary inboxes", () => {
    expect(signupGmail("person@googlemail.com")).toEqual({ message: GMAIL_ONLY_MESSAGE });
    expect(signupGmail("person@mailinator.com")).toEqual({ message: TEMP_MAIL_MESSAGE });
    expect(signupGmail("person@spam.guerrillamail.com")).toEqual({ message: TEMP_MAIL_MESSAGE });
    expect(signupGmail("person@yahoo.com")).toEqual({ message: GMAIL_ONLY_MESSAGE });
  });

  it("accepts Microsoft mail as typed", () => {
    expect(signupGmail("Some.One@Outlook.com")).toEqual({ email: "some.one@outlook.com" });
    expect(signupGmail("person_x@hotmail.com")).toEqual({ email: "person_x@hotmail.com" });
    expect(signupGmail("me@live.com")).toEqual({ email: "me@live.com" });
    expect(signupGmail("me@msn.com")).toEqual({ email: "me@msn.com" });
    expect(signupGmail(".me@outlook.com")).toEqual({ message: GMAIL_ONLY_MESSAGE });
  });

  it("rejects a Gmail name that is too short", () => {
    expect(signupGmail("abcde@gmail.com")).toEqual({ message: GMAIL_ONLY_MESSAGE });
  });
});

describe("signInEmail", () => {
  it("matches the saved Gmail address and leaves other mail alone", () => {
    expect(signInEmail("Yash.Kaku+desk@gmail.com")).toBe("yashkaku@gmail.com");
    expect(signInEmail("yash@studio.dev")).toBe("yash@studio.dev");
  });
});
