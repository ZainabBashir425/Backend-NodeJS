// import mongoose from "mongoose"
// import {Comment} from "../models/comment.models.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const getVideoComments = asyncHandler(async (req, res) => {
//     //TODO: get all comments for a video
//     const {videoId} = req.params
//     const {page = 1, limit = 10} = req.query

// })

// const addComment = asyncHandler(async (req, res) => {
//     // TODO: add a comment to a video
// })

// const updateComment = asyncHandler(async (req, res) => {
//     // TODO: update a comment
// })

// const deleteComment = asyncHandler(async (req, res) => {
//     // TODO: delete a comment
// })

// export {
//     getVideoComments, 
//     addComment, 
//     updateComment,
//      deleteComment
//     }


import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Get all comments for a specific video (with pagination)
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.aggregatePaginate(
        Comment.aggregate([
            { $match: { video: new mongoose.Types.ObjectId(videoId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                },
            },
            { $unwind: "$owner" },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "owner._id": 1,
                    "owner.username": 1,
                    "owner.avatar": 1,
                },
            },
            { $sort: { createdAt: -1 } }
        ]),
        { page: +page, limit: +limit }
    );

    res.status(200).json(new ApiResponse(200, comments, "Video comments fetched"));
});

// ✅ Add a new comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    });

    res.status(201).json(new ApiResponse(201, newComment, "Comment added"));
});

// ✅ Update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!comment.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to edit this comment");
    }

    comment.content = content || comment.content;
    await comment.save();

    res.status(200).json(new ApiResponse(200, comment, "Comment updated"));
});

// ✅ Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!comment.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await comment.deleteOne();

    res.status(200).json(new ApiResponse(200, null, "Comment deleted"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};
