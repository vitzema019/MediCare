import { IsOptional, IsString, Matches } from "class-validator";

// Regex pattern to match "YYYY-MM-DD" format
const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

export class GetTimeslotsQueryDto {
  @IsOptional()
  @IsString()
  @Matches(dateFormatRegex, {
    message: '"from" must be in the format "YYYY-MM-DD"',
  })
  from!: string;

  @IsOptional()
  @IsString()
  @Matches(dateFormatRegex, {
    message: '"to" must be in the format "YYYY-MM-DD"',
  })
  to!: string;

  get fromDate(): Date {
    if (!this.from) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      return today;
    }
    return new Date(this.from + "Z");
  }

  get toDate(): Date {
    if (!this.to) {
      const tomorrow = new Date(this.fromDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    return new Date(this.to + "Z");
  }
}
