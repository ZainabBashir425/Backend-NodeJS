import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new tweet
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
        throw new ApiError(400, "Tweet content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner: userId,
    });

    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

// Get all tweets of a specific user
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const tweets = await Tweet.find({ owner: userId })
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

// Update a tweet by owner
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const tweet = await Tweet.findOne({ _id: tweetId, owner: userId });

    if (!tweet) {
        throw new ApiError(404, "Tweet not found or unauthorized");
    }

    tweet.content = content || tweet.content;
    await tweet.save();

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

// Delete a tweet by owner
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;

    const tweet = await Tweet.findOne({ _id: tweetId, owner: userId });

    if (!tweet) {
        throw new ApiError(404, "Tweet not found or unauthorized");
    }

    await tweet.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};
