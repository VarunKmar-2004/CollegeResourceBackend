exports.getMyProfile = async (req, res) => {
  try {
    const user = req.user; // set in auth middleware
    const role = req.userRole;

    // Admin profile (no DB model)
    if (role === 'admin') {
      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: 'admin',
        },
        uploadedResources: [], // or you can return all resources for admin if you want
      });
    }

    // For student/faculty -> fetch their uploaded resources
    const uploadedResources = await Resource.find({
      'uploadedBy.id': user._id,
    }).sort({ createdAt: -1 });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        ...(role === 'student'
          ? { rollNumber: user.rollNumber }
          : { facultyId: user.facultyId, position: user.position }),
        branch: user.branch,
        profilePictureUrl: user.profilePictureUrl,
        role,
      },
      uploadedResources,
    });
  } catch (err) {
    console.error('getMyProfile error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
