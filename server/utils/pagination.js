/**
 * Pagination Utilities
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from query
 * @param {Object} query - Express request query object
 * @param {number} defaultLimit - Default items per page
 * @returns {Object} Pagination parameters
 */
function parsePagination(query, defaultLimit = DEFAULT_LIMIT) {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || defaultLimit)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata
 */
function createPaginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

/**
 * Execute a paginated query
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated results with metadata
 */
async function paginatedQuery(model, filter = {}, options = {}) {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    sort = { createdAt: -1 },
    select = null,
    populate = null,
  } = options;

  const skip = (page - 1) * limit;

  let query = model.find(filter).skip(skip).limit(limit).sort(sort);

  if (select) {
    query = query.select(select);
  }

  if (populate) {
    query = query.populate(populate);
  }

  const [items, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter),
  ]);

  return {
    items,
    pagination: createPaginationMeta(page, limit, total),
  };
}

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePagination,
  createPaginationMeta,
  paginatedQuery,
};

