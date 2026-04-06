import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import mongoose from "mongoose"


const healthcheck = asyncHandler(async (req, res) => {
    const dbStates = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    }

    const dbReadyState = mongoose.connection.readyState
    const dbStatus = dbStates[dbReadyState] || "unknown"

    if (dbReadyState !== 1) {
        throw new ApiError(503, `Database is ${dbStatus}`)
    }

    return res.status(200).json(
        new ApiResponse(200, "Healthcheck passed", {
            status: "OK",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: dbStatus
        })
    )
})

export {
    healthcheck
}
