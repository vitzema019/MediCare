import { IsOptional, IsString, Matches } from "class-validator";

// Regex pattern to match "YYYY-MM-DD" format
const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

export class GetTimeslotsQueryDto {
  @IsOptional()
  @IsString()
  @Matches(dateFormatRegex, {
    message: '"from" must be in the format "YYYY-MM-DD"',
  })
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(dateFormatRegex, {
    message: '"to" must be in the format "YYYY-MM-DD"',
  })
  to?: string;

  get fromDate(): Date {
    if (!this.from) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      return today;
    }
    // Parse as UTC date to avoid timezone issues
    const date = new Date(this.from + "T00:00:00Z");
    return date;
  }

  get toDate(): Date {
    if (!this.to) {
      const tomorrow = new Date(this.fromDate);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      return tomorrow;
    }
    // Parse as UTC date, set to end of day
    const date = new Date(this.to + "T23:59:59Z");
    return date;
  }
}
