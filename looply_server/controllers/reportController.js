import Report from "../models/Report.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";

// Create a new report
export const createReport = async (req, res) => {
  try {
    console.log("📝 createReport controller called");
    console.log("📝 Request body:", req.body);
    console.log("📝 Reporter ID:", req.user?._id);
    const { reportedType, reportedId, reason } = req.body;
    const reporterId = req.user._id;

    if (!reportedType || !reportedId || !reason) {
      return res.status(400).json({ message: "Thiếu thông tin báo cáo" });
    }

    if (!["user", "video", "comment"].includes(reportedType)) {
      return res.status(400).json({ message: "Loại báo cáo không hợp lệ" });
    }

    // Verify that the reported item exists
    let itemExists = false;
    if (reportedType === "user") {
      const user = await User.findById(reportedId);
      itemExists = !!user;
    } else if (reportedType === "video") {
      const video = await Video.findById(reportedId);
      itemExists = !!video;
    } else if (reportedType === "comment") {
      const comment = await Comment.findById(reportedId);
      itemExists = !!comment;
    }

    if (!itemExists) {
      return res.status(404).json({ message: "Không tìm thấy đối tượng được báo cáo" });
    }

    // Check if user is reporting themselves (for user reports)
    if (reportedType === "user" && reporterId.toString() === reportedId) {
      return res.status(400).json({ message: "Không thể báo cáo chính mình" });
    }

    const report = await Report.create({
      reporterId,
      reportedType,
      reportedId,
      reason,
      status: "pending"
    });

    await report.populate("reporterId", "name username avatar");

    console.log("✅ Report created successfully:", report._id);
    res.status(201).json({
      message: "Báo cáo đã được gửi thành công",
      report
    });
  } catch (error) {
    console.error("❌ Error creating report:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all reports (admin only)
export const getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status && ["pending", "resolved", "rejected"].includes(status)) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate("reporterId", "name username avatar")
      .populate("resolvedBy", "name username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      reports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get report by ID (admin only)
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("reporterId", "name username avatar email")
      .populate("resolvedBy", "name username");

    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update report status (admin only)
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user._id;

    if (!status || !["pending", "resolved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status phải là 'pending', 'resolved' hoặc 'rejected'" });
    }

    const updateData = { status };
    if (status === "resolved" || status === "rejected") {
      updateData.resolvedBy = adminId;
      updateData.resolvedAt = new Date();
    }

    const report = await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("reporterId", "name username avatar")
      .populate("resolvedBy", "name username");

    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    }

    res.json({
      message: "Cập nhật trạng thái báo cáo thành công",
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get reports by type (admin only)
export const getReportsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!["user", "video", "comment"].includes(type)) {
      return res.status(400).json({ message: "Loại báo cáo không hợp lệ" });
    }

    let query = { reportedType: type };
    if (status && ["pending", "resolved", "rejected"].includes(status)) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate("reporterId", "name username avatar")
      .populate("resolvedBy", "name username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      reports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

