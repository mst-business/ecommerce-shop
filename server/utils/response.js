/**
 * Response Utilities
 */

/**
 * Send a standardized success response
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 */
function sendSuccess(res, statusCode, data = null, message = null) {
  const response = {};
  
  if (data !== null) {
    response.data = data;
  }
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Send a standardized error response
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error message
 * @param {*} details - Optional error details
 */
function sendError(res, statusCode, error, details = null) {
  const response = { error };
  
  if (details) {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Legacy sendResponse for backward compatibility
 */
function sendResponse(res, statusCode, data = null, message = null, error = null) {
  if (error) {
    return sendError(res, statusCode, error);
  }
  return sendSuccess(res, statusCode, data, message);
}

module.exports = {
  sendSuccess,
  sendError,
  sendResponse,
};


