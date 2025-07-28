import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// const getChannelStats = asyncHandler(async (req, res) => {
//     // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
// })

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Count all videos uploaded by the user
    const totalVideos = await Video.countDocuments({ owner: userId });

    // Sum all views on user's videos
    const totalViewsAgg = await Video.aggregate([
        { $match: { owner: userId } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ]);
    const totalViews = totalViewsAgg[0]?.totalViews || 0;

    // Count subscribers (users who subscribed to this user)
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    // Count likes on this user's videos
    const userVideoIds = await Video.find({ owner: userId }).select("_id");
    const videoIdList = userVideoIds.map(video => video._id);

    const totalLikes = await Like.countDocuments({
        video: { $in: videoIdList }
    });

    res.status(200).json(
        new ApiResponse(200, {
            totalVideos,
            totalViews,
            totalSubscribers,
            totalLikes
        }, "Channel stats fetched")
    );
});


const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const videos = await Video.find({ owner: userId })
        .sort({ createdAt: -1 })
        .select("title description views createdAt thumbnail duration") // Optional: Only return needed fields
        .lean();

    res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched")
    );
});


export {
    getChannelStats, 
    getChannelVideos
    }