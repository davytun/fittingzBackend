class ApiResponse {
  static success(res, data = null, message = "OK", statusCode = 200, pagination = null, additionalFields = {}) {
    const response = {
      success: true,
      message,
      ...(data && { data }),
      ...(pagination && { pagination }),
      ...additionalFields
    };
    return res.status(statusCode).json(response);
  }

  static error(res, message = "Error", statusCode = 500, errorType = null, errors = null) {
    const response = {
      success: false,
      message,
      ...(errorType && { errorType }),
      ...(errors && { errors })
    };
    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;