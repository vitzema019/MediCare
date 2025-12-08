import { BadRequestException } from "@nestjs/common";
import { Matches } from "class-validator";

// Regex pattern to match "YYYY-MM-DD HH:mm" format
const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export class TimeSlotDto {
  @Matches(dateFormatRegex, {
    message: "from must be in the format 'YYYY-MM-DDTHH:mm'",
  })
  from!: string;

  @Matches(dateFormatRegex, {
    message: "to must be in the format 'YYYY-MM-DDTHH:mm'",
  })
  to!: string;

  get fromDate(): Date {
    return new Date(this.from + "Z");
  }

  get toDate(): Date {
    return new Date(this.to + "Z");
  }

  validate() {
    if (
      Number.isNaN(Number(this.fromDate)) ||
      Number.isNaN(Number(this.toDate))
    ) {
      throw new BadRequestException("'from' and 'to' must be valid dates");
    }

    if (this.fromDate >= this.toDate) {
      throw new BadRequestException("'from' must be before 'to'");
    }
  }
}
