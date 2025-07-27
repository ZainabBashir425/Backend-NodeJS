import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// GET ALL VIDEOS (with optional filters, pagination, sorting)
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

  const matchStage = {
    isPublished: true,
    ...(query && {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }),
    ...(userId && { owner: new mongoose.Types.ObjectId(userId) }),
  };

  const sortStage = {};
  sortStage[sortBy] = sortType === "asc" ? 1 : -1;

  const aggregateQuery = Video.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        owner: {
          _id: 1,
          username: 1,
          avatar: 1,
        },
      },
    },
    { $sort: sortStage },
  ]);

  const result = await Video.aggregatePaginate(aggregateQuery, {
    page: parseInt(page),
    limit: parseInt(limit),
  });

  return res.status(200).json(new ApiResponse(200, result, "Videos fetched successfully"));
});

// PUBLISH/UPLOAD VIDEO
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFilePath = req.files?.videoFile?.[0]?.path;
  const thumbnailPath = req.files?.thumbnail?.[0]?.path;

  if (!title || !description || !videoFilePath || !thumbnailPath) {
    throw new ApiError(400, "All fields are required");
  }

  const videoUpload = await uploadOnCloudinary(videoFilePath);
  const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);

  if (!videoUpload?.url || !thumbnailUpload?.url || !videoUpload?.duration) {
    throw new ApiError(500, "Failed to upload video or thumbnail");
  }

  const newVideo = await Video.create({
    videoFile: videoUpload.url,
    thumbnail: thumbnailUpload.url,
    title,
    description,
    duration: Math.floor(videoUpload.duration),
    owner: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, newVideo, "Video published successfully"));
});

// GET VIDEO BY ID
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("owner", "username avatar fullName")
    .lean();

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

// UPDATE VIDEO DETAILS
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const updateData = { title, description };

  if (req.file?.path) {
    const thumbnail = await uploadOnCloudinary(req.file.path);
    if (!thumbnail?.url) {
      throw new ApiError(400, "Failed to upload thumbnail");
    }
    updateData.thumbnail = thumbnail.url;
  }

  const updatedVideo = await Video.findOneAndUpdate(
    { _id: videoId, owner: req.user._id },
    { $set: updateData },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found or you're not authorized");
  }

  return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

// DELETE VIDEO
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const deletedVideo = await Video.findOneAndDelete({
    _id: videoId,
    owner: req.user._id,
  });

  if (!deletedVideo) {
    throw new ApiError(404, "Video not found or you're not authorized");
  }

  return res.status(200).json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

// TOGGLE PUBLISH STATUS
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findOne({ _id: videoId, owner: req.user._id });

  if (!video) {
    throw new ApiError(404, "Video not found or you're not authorized");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, `Video is now ${video.isPublished ? "published" : "unpublished"}`));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
