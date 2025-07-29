import mongoose from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle like for a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "Video unliked"));
    }

    const like = await Like.create({ video: videoId, likedBy: userId });
    return res.status(201).json(new ApiResponse(201, like, "Video liked"));
});

// Toggle like for a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "Comment unliked"));
    }

    const like = await Like.create({ comment: commentId, likedBy: userId });
    return res.status(201).json(new ApiResponse(201, like, "Comment liked"));
});

// Toggle like for a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "Tweet unliked"));
    }

    const like = await Like.create({ tweet: tweetId, likedBy: userId });
    return res.status(201).json(new ApiResponse(201, like, "Tweet liked"));
});

// Get all liked videos by user
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likes = await Like.find({ likedBy: userId, video: { $ne: null } })
        .populate("video", "-owner -createdAt -updatedAt")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, likes, "Liked videos fetched successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
};
