/*
 * ApiContractError — thrown when a SUCCESS response does not match the
 * QuizWheelz ApiResponse envelope. Failing fast here turns "undefined five
 * layers later" into one normalized API_CONTRACT error the feature can show
 * safely. HTTP failures never reach this: axios rejects them first.
 */
export class ApiContractError extends Error {
  constructor(message = "Unexpected API response shape") {
    super(message);
    this.name = "ApiContractError";
  }
}
