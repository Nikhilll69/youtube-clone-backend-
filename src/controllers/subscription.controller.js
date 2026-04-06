import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    if (req.user._id.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const [channel, existingSubscription] = await Promise.all([
        User.findById(channelId).select("_id"),
        Subscription.findOne({
            channel: channelId,
            subscriber: req.user._id
        })
    ])

    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    if (existingSubscription) {
        await Subscription.deleteOne({ _id: existingSubscription._id })

        return res.status(200).json(
            new ApiResponse(200, "Channel unsubscribed successfully", { isSubscribed: false })
        )
    }

    await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, "Channel subscribed successfully", { isSubscribed: true })
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
      if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }
    const channel = await User.findById(channelId).select("_id")

    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username fullName avatar")
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(200, "Channel subscribers fetched successfully", subscribers)
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request")
    }

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id")
    }

    const subscriber = await User.findById(subscriberId).select("_id")

    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found")
    }

    const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username fullName avatar coverImage")
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(200, "Subscribed channels fetched successfully", subscribedChannels)
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
