import { ApiContractError } from "../errors/ApiContractError";

/*
 * Every QuizWheelz endpoint wraps success payloads in the ApiResponse
 * envelope { success, message, data, timestamp } (httpClient already
 * unwrapped the axios layer; HTTP failures reject before reaching here).
 * `data` may legitimately be null for void endpoints such as logout.
 * Anything that is not a success envelope means the contract broke — fail
 * fast as an API_CONTRACT error instead of leaking `undefined` downstream.
 */
export function unwrapApiResponse(response) {
    if (response == null || typeof response !== "object" || response.success !== true) {
        throw new ApiContractError();
    }

    return response.data;
}
