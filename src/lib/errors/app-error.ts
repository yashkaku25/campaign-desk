export class AppError extends Error {
  readonly what: string;
  readonly why: string;
  readonly file: string;
  readonly connectedTo: string;
  readonly fix: string;
  readonly status: number;
  readonly logged: boolean;

  constructor(input: {
    what: string;
    why: string;
    file: string;
    connectedTo?: string;
    fix: string;
    status?: number;
    logged?: boolean;
  }) {
    super(input.what);
    this.name = "AppError";
    this.what = input.what;
    this.why = input.why;
    this.file = input.file;
    this.connectedTo = input.connectedTo ?? "";
    this.fix = input.fix;
    this.status = input.status ?? 400;
    this.logged = input.logged ?? false;
  }
}
